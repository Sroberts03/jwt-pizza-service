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
    const logOut = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logOut.status).toBe(200);
    expect(logOut.body.message).toBe('logout successful');
});

test('loginAndLogout', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    testUtils.expectValidJwt(loginRes.body.token);
    testUserAuthToken = loginRes.body.token;

    const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
    delete expectedUser.password;
    expect(loginRes.body.user).toMatchObject(expectedUser);

    const logOut = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logOut.status).toBe(200);
    expect(logOut.body.message).toBe('logout successful');
});