const request = require('supertest');
const app = require('../service');
const testUtils = require('./testUtils');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUtils.expectValidJwt(testUserAuthToken);
});

test('getMenu', async () => {
    const menuRes = await request(app).get('/api/order/menu');
    expect(menuRes.status).toBe(200);
    expect(Array.isArray(menuRes.body)).toBe(true);
    expect(menuRes.body.length).toBeGreaterThan(0);
});

afterAll(async () => {
    const logOut = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logOut.status).toBe(200);
    expect(logOut.body.message).toBe('logout successful');
})