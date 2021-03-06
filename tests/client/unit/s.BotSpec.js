describe('Bot class', function () {
  beforeEach(function (done) {
    var createPlayers = function () {
      s.game.player = makePlayer('Player one');
      bot = makeBot();
    };

    runAsync(createPlayers, done);
  });

  it('should create new Bot instance', function (done) {
    var specs = function () {
      expect(bot).to.be.an('object');
      expect(bot.isBot).to.equal(true);
    };

    runAsync(specs, done);
  });

  it('should increment bot counter', function (done) {
    var specs = function () {
      // Expect 2 because the spec share the same game object
      // Previous test add the first one
      expect(s.game.botCount).to.equal(2);
    };

    runAsync(specs, done);
  });

  it('should have botOptions property with default values', function (done) {
    var specs = function () {
      expect(bot.botOptions).to.be.an('object');
      expect(bot.botOptions).to.have.property('rotationSpeed').and.to.not.equal(undefined);
      expect(bot.botOptions).to.have.property('pitchSpeed').and.to.not.equal(undefined);
      expect(bot.botOptions).to.have.property('yawSpeed').and.to.not.equal(undefined);
      expect(bot.botOptions).to.have.property('thrustImpulse').and.to.not.equal(undefined);
      expect(bot.botOptions).to.have.property('brakePower').and.to.not.equal(undefined);
      expect(bot.botOptions).to.have.property('velocityFadeFactor').and.to.not.equal(undefined);
      expect(bot.botOptions).to.have.property('rotationFadeFactor').and.to.not.equal(undefined);
    };

    runAsync(specs, done);
  });

  describe('handle enemies', function () {
    it('should get enemies list', function (done) {
      var specs = function () {
        expect(bot.getEnemyList).to.be.an('function');
        expect(bot.botEnemyList).to.equal(undefined);

        var player2 = makePlayer('Player two');
        s.game.enemies._list.push(player2);
        s.game.enemies._map[player2.name] = player2;

        bot.getEnemyList();

        expect(bot.botEnemyList).to.be.an('array');
        expect(bot.botEnemyList.length).to.equal(2);
        expect(bot.botEnemyList[0].name).to.equal('Player one');
        expect(bot.botEnemyList[1].name).to.equal('Player two');

        s.game.enemies.delete('Player two');
      };

      runAsync(specs, done);
    });

    it('should get closest enemy distance', function (done) {
      var specs = function () {
        bot.getEnemyList();

        expect(bot.getClosestDistance).to.be.an('function');
        expect(bot.closestDistance).to.equal(undefined);
        bot.getClosestDistance();
        expect(bot.closestDistance).to.not.equal(undefined).and.to.not.equal(null);
      };

      runAsync(specs, done);
    });
  });

  describe('should control its directions and move', function () {
    describe('when enemy is in front of bot', function () {
      it('should turn left based on enemy position', function (done) {
        var specs = function () {
          var stub = makeGetEnemyPositionsStub(bot, -0.16, 0, 0.5);
          bot.controlBot();
          expect(bot.moveStates.yaw).to.be.above(0);
        };

        runAsync(specs, done);
      });

      it('should turn right based on enemy position', function (done) {
        var specs = function () {
          var stub = makeGetEnemyPositionsStub(bot, 0.16, 0, 0.5);
          bot.controlBot();
          expect(bot.moveStates.yaw).to.be.below(0);
        };

        runAsync(specs, done);
      });

      it('should turn down based on enemy position', function (done) {
        var specs = function () {
          var stub = makeGetEnemyPositionsStub(bot, 0.16, -0.16, 0.5);
          bot.controlBot();
          expect(bot.moveStates.pitch).to.be.below(0);
        };

        runAsync(specs, done);
      });

      it('should turn up based on enemy position', function (done) {
        var specs = function () {
          var stub = makeGetEnemyPositionsStub(bot, 0.16, 0.16, 0.5);
          bot.controlBot();
          expect(bot.moveStates.pitch).to.be.above(0);
        };

        runAsync(specs, done);
      });
    });

    describe('when enemy is behind of bot', function () {
      it('should turn right based on enemy position', function (done) {
        var specs = function () {
          var stub = makeGetEnemyPositionsStub(bot, -0.16, 0, 1);
          bot.controlBot();
          expect(bot.moveStates.yaw).to.be.below(0);
        };

        runAsync(specs, done);
      });

      it('should turn left based on enemy position', function (done) {
        var specs = function () {
          var stub = makeGetEnemyPositionsStub(bot, 0.16, 0, 1);
          bot.controlBot();
          expect(bot.moveStates.yaw).to.be.above(0);
        };

        runAsync(specs, done);
      });

      it('should turn up based on enemy position', function (done) {
        var specs = function () {
          var stub = makeGetEnemyPositionsStub(bot, 0.16, -0.16, 1);
          bot.controlBot();
          expect(bot.moveStates.pitch).to.be.above(0);
        };

        runAsync(specs, done);
      });

      it('should turn down based on enemy position', function (done) {
        var specs = function () {
          var stub = makeGetEnemyPositionsStub(bot, 0.16, 0.16, 1);
          bot.controlBot();
          expect(bot.moveStates.pitch).to.be.below(0);
        };

        runAsync(specs, done);
      });
    });

    it('should get enemy list and get closest enemy distance on every call', function (done) {
      var specs = function () {
        var getEnemyList = sinon.spy(bot, 'getEnemyList');
        var getClosestDistance = sinon.spy(bot, 'getClosestDistance');

        bot.controlBot();

        expect(getEnemyList.called).to.equal(true);
        expect(bot.botEnemyList).to.be.an('array');

        expect(getClosestDistance.called).to.equal(true);
        expect(bot.closestDistance).to.not.equal(undefined).and.to.not.equal(null);
      };

      runAsync(specs, done);
    });

    it('should thrust if closest enemy is far away', function (done) {
      var specs = function () {
        var stub = makeDistanceStub(bot, 5000);
        expect(bot.botOptions.thrustImpulse).to.equal(0);
        bot.controlBot();
        expect(bot.moveStates.thrust).to.equal(1);
        expect(bot.botOptions.thrustImpulse).to.be.above(0);
      };

      runAsync(specs, done);
    });

    it('should brake if closest enemy is in the minDistance range', function (done) {
      var specs = function () {
        var stub = makeDistanceStub(bot, 5000);
        expect(bot.botOptions.thrustImpulse).to.equal(0);
        bot.controlBot();
        expect(bot.moveStates.thrust).to.equal(1);
        expect(bot.botOptions.thrustImpulse).to.be.above(0);
        var thrustImpulse = bot.botOptions.thrustImpulse;
        stub.restore();
        bot.controlBot();
        expect(bot.moveStates.brakes).to.equal(1);
        expect(bot.botOptions.thrustImpulse).to.be.at.most(thrustImpulse);
      };

      runAsync(specs, done);
    });

    describe('between max and min distance', function () {
      it('should thurst', function (done) {
        var specs = function () {
          var stub = makeDistanceStub(bot, 3000);
          bot.controlBot();
          expect(bot.moveStates.thrust).to.equal(1);
        };

        runAsync(specs, done);
      });

      it('should brake', function (done) {
        var specs = function () {
          var stub = makeDistanceStub(bot, 1501);
          bot.botOptions.thrustImpulse += 1;
          bot.controlBot();
          expect(bot.moveStates.brakes).to.equal(1);
        };

        runAsync(specs, done);
      });
    });
  });

  it('should fire', function (done) {
    var specs = function () {
      var spy = sinon.spy(bot, 'fire');
      var positionStub = makeGetEnemyPositionsStub(bot, 0.15, 0.15, 0);
      var distanceStub = makeDistanceStub(bot, 2000);
      bot.controlBot();
      expect(spy.called).to.equal(true);
    };

    runAsync(specs, done);
  });
});
