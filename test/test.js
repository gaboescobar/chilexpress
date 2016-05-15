'use strict';

const path = require('path');

const expect = require('chai').expect;
const nock = require('nock');

const lib = require('../src');

describe('chilexpress', () => {

  describe('valid order id', () => {

    const orderId = '11111111111';
    const transportId = '22222222222';

    beforeEach(() => {
      nock.disableNetConnect();
      nock('https://www.chilexpress.cl')
        .get('/Views/ChilexpressCL/Resultado-busqueda.aspx')
        .query({DATA: orderId})
        .replyWithFile(200, path.join(__dirname, 'valid.html'));
      nock('https://www.chilexpress.cl')
        .post('/Views/ChilexpressCL/Resultado-busqueda.aspx/ObtieneTrakingWEBM', JSON.stringify({ot: transportId, Filas: 0, Hoja: 0}))
        .replyWithFile(200, path.join(__dirname, 'valid2.html'));
    });

    it('should return a array statuses', done => {
      lib(orderId).then(data => {
        expect(data).to.be.a('object');
        expect(data).to.include.keys('orderId', 'transportId', 'product', 'service', 'status', 'isDeliveried', 'history');
        for (let history of data.history) {
          expect(history).to.include.keys('datetime', 'activity');
          expect(history.datetime).to.be.a('date');
          expect(history.activity).to.be.a('string');
        }
        done();
      }).catch(err => {
        expect(err).to.be.null;
        done();
      });
    });
  });

  describe('invalid order id', () => {

    const orderId = '1';

    beforeEach(() => {
      nock.disableNetConnect();
      nock('https://www.chilexpress.cl')
        .get('/Views/ChilexpressCL/Resultado-busqueda.aspx')
        .query({DATA: orderId})
        .replyWithFile(200, path.join(__dirname, 'invalid.html'));
    });

    it('should return a error', done => {
      lib(orderId).then((data) => {
        expect(data).to.be.undefined;
        done();
      }).catch(err => {
        expect(err).to.eql(new Error('Not found order id'));
        done();
      });
    });
  });
});
