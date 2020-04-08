const fetch = require("node-fetch");

test("server listen", async done => {
  const Health = require("../index");
  const health = await new Health({
    host: "localhost",
    port: 9800,
    compatibleWith: {
      foo: "^1.0.0",
      bar: "^2.0.0"
    }
  }).startup();

  fetch("http://localhost:9800/health")
    .then(async result => {
      expect(result.status).toBe(200);
      await health.shutdown();
      done();
    })
    .catch(async err => {
      await health.shutdown();
      done.fail("Failed to query health app server! Error: " + err);
    });
});

test("check compatability with other health server", async done => {
  const Health = require("../index");

  const healthA = await new Health({
    host: "localhost",
    port: 9800,
    compatibleWith: {
      foo: "^1.0.0",
      bar: "^2.0.0",
      "check-connectivity": "^1.0.0"
    }
  }).startup();

  const healthB = await new Health({
    host: "localhost",
    port: 9900,
    compatibleWith: {
      foo: "^1.0.0",
      bar: "^2.0.0"
    }
  }).startup();

  healthA
    .checkCompatabilityWith("http://localhost:9900/health")
    .then(async result => {
      expect(result).toBeTruthy();
      await healthA.shutdown();
      await healthB.shutdown();
      done();
    })
    .catch(async err => {
      await healthA.shutdown();
      await healthB.shutdown();
      done.fail("Failed to query other health app server! Error: " + err);
    });
});

test("/checkCompatability serving middleware", done => {
  const Health = require("../index");
  const health = new Health({
    host: "localhost",
    port: 9800,
    compatibleWith: {
      foo: "^1.0.0",
      bar: "^2.0.0"
    }
  });

  const express = require("express");
  const http = require("http");
  const app = express();
  const server = http.createServer(app);

  app.use(health.middleware());

  server.listen(3000);

  fetch("http://localhost:3000/checkCompatability?name=foo&version=1.2.3-beta")
    .then(result => {
      expect(result.status).toBe(200);
      return result;
    })
    .then(result => result.json())
    .then(body => {
      expect(body.result).toBeTruthy();
      server.close();
      done();
    })
    .catch(err => {
      server.close();
      done.fail("Failed to query app server! Error: " + err);
    });
});
