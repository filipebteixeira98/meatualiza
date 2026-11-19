import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { deleteApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import {
  deleteApp as deleteAdminApp,
  getApps as getAdminApps,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAdminApp } from "../../src/lib/firebase/admin.ts";
import { getBrowserAuth } from "../../src/lib/firebase/client.ts";
import { createStudentSession } from "../../src/lib/auth/session.ts";
import {
  changeForum,
  getForumFeed,
  getForumTopic,
  ForumError,
} from "../../src/lib/forum-store.ts";
import { FORUM_PAGE_SIZE } from "../../src/lib/forum.ts";

assert.equal(process.env.GCLOUD_PROJECT, "demo-meatualiza");
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
Object.assign(process.env, {
  NODE_ENV: "test",
  FIREBASE_PROJECT_ID: "demo-meatualiza",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-meatualiza.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-meatualiza",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
  NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true",
});

let database;
let students;
let monitor;
const content = {
  title: "Como encerrar a repetição?",
  topicId: "repeticao",
  body: "enquanto (contador < 10) { escreva(contador); }",
};
const execute = (user, command, id = randomUUID()) =>
  changeForum(user?.cookie, command, id);
const publish = (user = students[0], id = randomUUID()) =>
  execute(user, { type: "createTopic", content }, id);
const reply = (topicId, user = students[1], id = randomUUID()) =>
  execute(
    user,
    {
      type: "reply",
      topicId,
      content: { body: "Atualize o contador dentro do laço." },
    },
    id,
  );
const row = async (id) =>
  (await database.doc(`forumTopics/${id}`).get()).data();

async function account(isMonitor = false, name = "Participante Fórum") {
  const sub = randomUUID();
  const { user } = await signInWithCredential(
    getBrowserAuth(),
    GoogleAuthProvider.credential(
      JSON.stringify({
        sub,
        email: `${sub}@example.test`,
        email_verified: true,
        name,
      }),
    ),
  );
  if (isMonitor)
    await getAuth(getAdminApp()).setCustomUserClaims(user.uid, {
      monitor: true,
    });
  const cookie = await createStudentSession(await user.getIdToken(isMonitor));
  await signOut(getBrowserAuth());
  return { uid: user.uid, cookie };
}
before(async () => {
  database = getFirestore(getAdminApp());
  students = [await account(), await account()];
  monitor = await account(true, "Monitor Fórum");
});
beforeEach(async () => {
  await database.recursiveDelete(database.collection("forumTopics"));
  await database.recursiveDelete(database.collection("forumOperations"));
});
after(async () => {
  await Promise.all([
    ...getApps().map(deleteApp),
    ...getAdminApps().map(deleteAdminApp),
  ]);
});

test("autenticação e dados compartilhados são verificados junto às leituras e escritas", async () => {
  assert.equal(await getForumFeed(), null);
  assert.equal(await getForumTopic(undefined, randomUUID()), null);
  await assert.rejects(publish(null), ForumError);
  const { topicId } = await publish();
  await reply(topicId);
  await reply(topicId, monitor);
  const view = await getForumTopic(students[1].cookie, topicId);
  assert.equal(view.topic.mine, false);
  assert.equal(view.topic.body, content.body);
  assert.equal(view.replies.length, 2);
  assert.equal(view.replies[0].mine, true);
  assert.equal(view.replies[1].author.role, "monitor");
  for (const secret of [
    students[0].uid,
    students[1].uid,
    "@example.test",
    "authorId",
    "hash",
    "by",
  ])
    assert.equal(JSON.stringify(view).includes(secret), false);
  assert.equal(
    (await getForumTopic(students[0].cookie, "../users")).topic,
    null,
  );
  await assert.rejects(getForumFeed(students[0].cookie, "invalid"), ForumError);
  await assert.rejects(
    execute(students[0], {
      type: "createTopic",
      content: { ...content, authorId: monitor.uid },
    }),
    ForumError,
  );
  await assert.rejects(
    execute(students[0], { type: "createTopic", content }, "invalid"),
    ForumError,
  );
});

test("somente o autor edita e versões antigas não sobrescrevem alterações", async () => {
  const { topicId } = await publish();
  const command = {
    type: "editTopic",
    topicId,
    expectedVersion: 1,
    content: { ...content, title: "Como atualizar o contador?" },
  };
  for (const user of [students[1], monitor])
    await assert.rejects(execute(user, command), ForumError);
  const id = randomUUID();
  await execute(students[0], command, id);
  await assert.rejects(execute(students[0], command), ForumError);
  await execute(students[0], {
    ...command,
    expectedVersion: 2,
    content: { ...content, title: "Condição de parada revisada" },
  });
  await execute(students[0], command, id);
  assert.equal((await row(topicId)).version, 3);
  const replyId = randomUUID();
  await reply(topicId, students[1], replyId);
  const edit = {
    type: "editReply",
    topicId,
    replyId,
    expectedVersion: 1,
    content: { body: "Atualize antes de testar novamente." },
  };
  await assert.rejects(execute(students[0], edit), ForumError);
  await execute(students[1], edit);
  assert.equal(
    (await getForumTopic(students[0].cookie, topicId)).replies[0].body,
    edit.content.body,
  );
  const concurrent = await Promise.allSettled([
    execute(students[0], { ...command, expectedVersion: 3 }),
    execute(students[0], { ...command, expectedVersion: 3 }),
  ]);
  assert.equal(
    concurrent.filter(({ status }) => status === "fulfilled").length,
    1,
  );
});

test("reenvios e criações concorrentes não duplicam tópicos, respostas ou contagens", async () => {
  const id = randomUUID();
  const results = await Promise.all([
    publish(students[0], id),
    publish(students[0], id),
  ]);
  assert.equal(results[0].topicId, results[1].topicId);
  assert.equal((await database.collection("forumTopics").get()).size, 1);
  const replyId = randomUUID();
  await Promise.all([
    reply(id, students[1], replyId),
    reply(id, students[1], replyId),
    reply(id, monitor),
  ]);
  assert.equal((await row(id)).replyCount, 2);
  assert.equal(
    (await database.collection(`forumTopics/${id}/replies`).get()).size,
    2,
  );
  await assert.rejects(
    execute(
      students[1],
      { type: "reply", topicId: id, content: { body: "Outra resposta" } },
      replyId,
    ),
    ForumError,
  );
});

test("moderação oculta o conteúdo no servidor, impede alterações e preserva histórico para restauração", async () => {
  const { topicId } = await publish();
  const replyId = randomUUID();
  await reply(topicId, students[1], replyId);
  const hide = {
    type: "moderateReply",
    topicId,
    replyId,
    expectedVersion: 1,
    hidden: true,
    reason: "Conteúdo fora do assunto.",
  };
  await assert.rejects(execute(students[0], hide), ForumError);
  const op = randomUUID();
  await execute(monitor, hide, op);
  const hiddenReply = (await getForumTopic(students[0].cookie, topicId))
    .replies[0];
  assert.equal(hiddenReply.body, "");
  assert.equal(hiddenReply.author, null);
  assert.equal(hiddenReply.moderationReason, "");
  await assert.rejects(
    execute(students[1], {
      type: "editReply",
      topicId,
      replyId,
      expectedVersion: 2,
      content: { body: "Mudar depois da moderação" },
    }),
    ForumError,
  );
  const log = (
    await database.doc(`forumOperations/${monitor.uid}_${op}`).get()
  ).data();
  assert.equal(log.by, monitor.uid);
  assert.equal(log.reason, hide.reason);
  assert.ok(log.at instanceof Timestamp);
  const moderateTopic = {
    type: "moderateTopic",
    topicId,
    expectedVersion: 1,
    hidden: true,
    reason: "Revisar discussão.",
  };
  await execute(monitor, moderateTopic);
  const hidden = await getForumTopic(students[0].cookie, topicId);
  assert.equal(hidden.topic.body, "");
  assert.equal(hidden.topic.topicId, "");
  assert.equal(hidden.topic.author, null);
  assert.deepEqual(hidden.replies, []);
  const list = await getForumFeed(students[0].cookie);
  assert.equal(list.topics[0].title, "Tópico ocultado pela moderação");
  assert.equal(
    (await getForumTopic(monitor.cookie, topicId)).topic.body,
    content.body,
  );
  await assert.rejects(reply(topicId), ForumError);
  await assert.rejects(
    execute(students[0], {
      type: "editTopic",
      topicId,
      expectedVersion: 2,
      content,
    }),
    ForumError,
  );
  await execute(monitor, {
    ...moderateTopic,
    hidden: false,
    expectedVersion: 2,
    reason: "",
  });
  await execute(monitor, {
    ...hide,
    hidden: false,
    expectedVersion: 2,
    reason: "",
  });
  assert.equal(
    (await getForumTopic(students[0].cookie, topicId)).replies[0].body,
    "Atualize o contador dentro do laço.",
  );
  await execute(monitor, hide, op);
  assert.equal(
    (await getForumTopic(students[0].cookie, topicId)).replies[0].hidden,
    false,
  );
});

test("paginação mantém ordenação estável inclusive com datas iguais e publicações ocultadas", async () => {
  const stamp = Timestamp.fromMillis(1_800_000_000_000);
  const ids = [];
  for (let index = 0; index < FORUM_PAGE_SIZE + 2; index++) {
    const { topicId } = await publish();
    await database.doc(`forumTopics/${topicId}`).update({ createdAt: stamp });
    ids.push(topicId);
  }
  await execute(monitor, {
    type: "moderateTopic",
    topicId: ids[0],
    expectedVersion: 1,
    hidden: true,
    reason: "Moderação de teste",
  });
  const first = await getForumFeed(students[0].cookie);
  const second = await getForumFeed(students[0].cookie, first.nextCursor);
  assert.equal(first.topics.length, FORUM_PAGE_SIZE);
  assert.equal(second.topics.length, 2);
  assert.equal(second.nextCursor, null);
  assert.deepEqual(
    [...first.topics, ...second.topics].map(({ id }) => id),
    [...ids].sort().reverse(),
  );
  const replyIds = [];
  for (let index = 0; index < FORUM_PAGE_SIZE + 2; index++) {
    const id = randomUUID();
    await reply(ids[1], students[1], id);
    await database
      .doc(`forumTopics/${ids[1]}/replies/${id}`)
      .update({ createdAt: stamp });
    replyIds.push(id);
  }
  const one = await getForumTopic(students[0].cookie, ids[1]);
  const two = await getForumTopic(students[0].cookie, ids[1], one.nextCursor);
  assert.deepEqual(
    [...one.replies, ...two.replies].map(({ id }) => id),
    [...replyIds].sort(),
  );
  assert.equal(two.nextCursor, null);
});

test("revogar a claim de monitor remove imediatamente a permissão de moderação", async () => {
  const temporary = await account(true);
  const { topicId } = await publish();
  await getAuth(getAdminApp()).setCustomUserClaims(temporary.uid, {});
  await assert.rejects(
    execute(temporary, {
      type: "moderateTopic",
      topicId,
      expectedVersion: 1,
      hidden: true,
      reason: "Não deve funcionar",
    }),
    ForumError,
  );
});

test("só o autor exclui, sem duplicar o efeito ou expor conteúdo removido", async () => {
  const { topicId } = await publish();
  const replyId = randomUUID();
  await reply(topicId, students[1], replyId);
  const remaining = randomUUID();
  await reply(topicId, monitor, remaining);
  const deleteReply = {
    type: "deleteReply",
    topicId,
    replyId,
    expectedVersion: 1,
  };
  const deleteTopic = { type: "deleteTopic", topicId, expectedVersion: 1 };
  for (const user of [students[0], monitor])
    await assert.rejects(execute(user, deleteReply), /Somente o autor/);
  for (const user of [students[1], monitor])
    await assert.rejects(execute(user, deleteTopic), /Somente o autor/);
  await assert.rejects(
    execute(students[1], { ...deleteReply, expectedVersion: 2 }),
    /publicação foi alterada/,
  );
  const operation = randomUUID();
  await execute(students[1], deleteReply, operation);
  await execute(students[1], deleteReply, operation);
  const topic = await getForumTopic(monitor.cookie, topicId);
  assert.equal(topic.topic.replyCount, 1);
  assert.deepEqual(
    topic.replies.map(({ id }) => id),
    [remaining],
  );
  const deletedReply = await database
    .doc(`forumTopics/${topicId}/replies/${replyId}`)
    .get();
  assert.deepEqual(Object.keys(deletedReply.data()), ["deletedCreatedAt"]);
  await assert.rejects(
    execute(monitor, { ...deleteReply, type: "moderateReply", hidden: false }),
    /Publicação indisponível/,
  );
  const nextTopic = (await publish()).topicId;
  const oldDate = (await row(topicId)).createdAt.toMillis();
  await database.doc(`forumTopics/${nextTopic}`).update({
    createdAt: Timestamp.fromMillis(oldDate + 1000),
  });
  await execute(students[0], deleteTopic);
  for (const user of [...students, monitor]) {
    const deleted = await getForumTopic(user.cookie, topicId);
    assert.equal(deleted.topic, null);
    assert.deepEqual(deleted.replies, []);
    assert.deepEqual(
      (await getForumFeed(user.cookie)).topics.map(({ id }) => id),
      [nextTopic],
    );
    assert.deepEqual((await getForumFeed(user.cookie, topicId)).topics, []);
  }
  await assert.rejects(reply(topicId), /tópico está indisponível/);
  await assert.rejects(publish(students[1], topicId), /publicação já existe/);
  assert.deepEqual(Object.keys(await row(topicId)), ["deletedCreatedAt"]);
});
