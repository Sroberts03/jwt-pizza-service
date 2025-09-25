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

test('getUser', async () => {
    const loggedInToken = await testUtils.loginUser(app, testUser);
    const meRes = await request(app).get('/api/user/me').set('Authorization', `Bearer ${loggedInToken}`);
    expect(meRes.status).toBe(200);
    const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
    delete expectedUser.password;
    expect(meRes.body).toMatchObject(expectedUser);
})

test('updateUser', async () => {
    const loggedInToken = await testUtils.loginUser(app, testUser);
    const meRes = await request(app).get('/api/user/me').set('Authorization', `Bearer ${loggedInToken}`);
    const userId = meRes.body.id;
    const newName = 'new name';
    const newEmail = Math.random().toString(36).substring(2, 12) + '@test.com';
    const newPassword = 'new password';
    const updateRes = await request(app).put(`/api/user/${userId}`).send({ name: newName, email: newEmail, password: newPassword }).set('Authorization', `Bearer ${loggedInToken}`);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user).toMatchObject({ id: userId, name: newName, email: newEmail, roles: [{ role: 'diner' }] });
    testUtils.expectValidJwt(updateRes.body.token);
})

afterAll(async () => {
    const logOut = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logOut.status).toBe(200);
    expect(logOut.body.message).toBe('logout successful');
})