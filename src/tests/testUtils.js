const request = require("supertest");

const adminUser = { name: 'admin user', email: Math.random().toString(36).substring(2, 12) + '@test.com', password: 'adminpass' };
const orderReq = { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] };


async function loginUser(app, testUser) {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);
    return loginRes.body.token;
}

async function loginAdminUser(app) {

    const registerRes = await request(app).post('/api/auth').send(adminUser);
    expect(registerRes.status).toBe(200);
    expectValidJwt(registerRes.body.token);
    await request(app).post('/api/user/1/role').send({ role: 'admin' }).set('Authorization', `Bearer ${registerRes.body.token}`);
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);

    return loginRes.body.token;
}

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

module.exports = { loginUser, expectValidJwt, loginAdminUser, orderReq };