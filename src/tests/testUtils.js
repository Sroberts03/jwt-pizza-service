const request = require("supertest");
const { DB, Role } = require('../database/database.js');

const orderReq = { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] };

async function loginUser(app, testUser) {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);
    return loginRes.body.token;
}

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(36).substring(2, 12);
    user.email = user.name + '@test.com';

    await DB.addUser(user);
    user.password = 'toomanysecrets';

    return user;
}

async function createTestFranchise(app) {
    const adminUser = await createAdminUser();
    const adminToken = await loginUser(app, adminUser);
    const testFranchiseName = Math.random().toString(36).substring(2, 12) + 'Test_franchise';
    const createFranchiseRes = await request(app).post('/api/franchise').send({ name: testFranchiseName, admins: [{ email: adminUser.email }] }).set('Authorization', `Bearer ${adminToken}`);
    expect(createFranchiseRes.status).toBe(200);
    expect(createFranchiseRes.body.name).toBe(testFranchiseName);
    return [createFranchiseRes.body.id, adminToken];
}

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

module.exports = { loginUser, expectValidJwt, createAdminUser, createTestFranchise, orderReq };