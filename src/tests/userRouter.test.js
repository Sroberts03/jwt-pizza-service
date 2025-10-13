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
    const meRes = await request(app).get('/api/user/me').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(meRes.status).toBe(200);
    const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
    delete expectedUser.password;
    expect(meRes.body).toMatchObject(expectedUser);
})

test('updateUser', async () => {
    const meRes = await request(app).get('/api/user/me').set('Authorization', `Bearer ${testUserAuthToken}`);
    const userId = meRes.body.id;
    const newName = 'new name';
    const newEmail = Math.random().toString(36).substring(2, 12) + '@test.com';
    const newPassword = 'new password';
    const updateRes = await request(app).put(`/api/user/${userId}`).send({ name: newName, email: newEmail, password: newPassword }).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user).toMatchObject({ id: userId, name: newName, email: newEmail, roles: [{ role: 'diner' }] });
    testUtils.expectValidJwt(updateRes.body.token);
    await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    testUserAuthToken = updateRes.body.token;
})

test('list users unauthorized', async () => {
  const listUsersRes = await request(app).get('/api/user');
  expect(listUsersRes.status).toBe(401);
});

test('list users authorized', async () => {
    const listTestUser = {name : 'list user', email: Math.random().toString(36).substring(2, 12) + '@test.com', password: 'a'};
    const listUser = await request(app).post('/api/auth').send(listTestUser);
    await request(app).delete('/api/auth').set('Authorization', `Bearer ${listUser.body.token}`);
    const adminUser = await testUtils.createAdminUser();
    const adminToken = await testUtils.loginUser(app, adminUser);
    const listUsersRes = await request(app).get('/api/user').set('Authorization', `Bearer ${adminToken}`);
    expect(listUsersRes.status).toBe(200);
    expect(listUsersRes.body).toMatchObject({
        users: expect.arrayContaining([{
                id: expect.any(Number),
                name: listTestUser.name,
                email: expect.any(String),
                roles: expect.any(Array)
            }])
    });
    await request(app).delete('/api/auth').set('Authorization', `Bearer ${adminToken}`);
 });

afterAll(async () => {
    const logOut = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logOut.status).toBe(200);
    expect(logOut.body.message).toBe('logout successful');
})