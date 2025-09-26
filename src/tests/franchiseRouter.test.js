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

test('getFranchises', async () => {
    const fIdAToken = await testUtils.createTestFranchise(app);
    const res = await request(app).get('/api/franchise').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(res.status).toBe(200);
    expect(res.body.franchises.length).toBeGreaterThan(0);
    await request(app).delete('/api/auth').set('Authorization', `Bearer ${fIdAToken[1]}`);
})

test('createAndDeleteFranchise', async () => {
    const fIdAToken = await testUtils.createTestFranchise(app);
    const franchiseId = fIdAToken[0];
    const adminToken = fIdAToken[1];

    const deleteFranchiseRes = await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(deleteFranchiseRes.status).toBe(200);
    expect(deleteFranchiseRes.body.message).toBe('franchise deleted');
    await request(app).delete('/api/auth').set('Authorization', `Bearer ${adminToken}`);
})

afterAll(async () => {
    const logOut = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logOut.status).toBe(200);
    expect(logOut.body.message).toBe('logout successful');
    await testUtils.cleanApp();
})