const request = require("supertest");
const { DB, Role } = require('../database/database.js');

const adminUser = { name: 'admin user', email: Math.random().toString(36).substring(2, 12) + '@test.com', password: 'adminpass' };
const orderReq = { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] };


async function loginUser(app, testUser) {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);
    return loginRes.body.token;
}

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = adminUser.name + Math.random().toString(36).substring(2, 12);
    user.email = user.name + '@admin.com';

    await DB.addUser(user);
    user.password = 'toomanysecrets';

    return user;
}

async function loginAdminUser(app, adminUser) {
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);

    return loginRes.body.token;
}

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

module.exports = { loginUser, expectValidJwt, loginAdminUser, createAdminUser, orderReq };