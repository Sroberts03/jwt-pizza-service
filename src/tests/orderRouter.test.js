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

test('addItemAndGetMenu', async () => {
    const adminUser = await testUtils.createAdminUser();
    const adminToken = await testUtils.loginUser(app, adminUser);
    const newItem = { title: 'Test Item', image: 'test.png', price: 9.99, description: 'Test Item' };
    const addRes = await request(app).put('/api/order/menu').send(newItem).set('Authorization', `Bearer ${adminToken}`);
    expect(addRes.status).toBe(200);
    expect(Array.isArray(addRes.body)).toBe(true);
    expect(addRes.body.find(i => i.description === newItem.description && i.price === newItem.price
        && i.title === newItem.title)).toBeDefined();

    const menuRes = await request(app).get('/api/order/menu');
    expect(menuRes.status).toBe(200);
    expect(Array.isArray(menuRes.body)).toBe(true);
    expect(menuRes.body.length).toBeGreaterThan(0);
    await request(app).delete('/api/auth').set('Authorization', `Bearer ${adminToken}`);
});

test('addMenuItem - unauthorized', async () => {
    const newItem = { description: 'Test Item', price: 9.99 };
    const addRes = await request(app).put('/api/order/menu').send(newItem).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(addRes.status).toBe(403);
    expect(addRes.body.message).toBe('unable to add menu item');
})

test('createOrder', async () => {
    const orderRes = await request(app).post('/api/order').send(testUtils.orderReq).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.order).toMatchObject(testUtils.orderReq);
    expect(orderRes.body.order.id).toBeDefined();
    expect(orderRes.body.jwt).toBeDefined();
})

test('getOrders', async () => {
    await request(app).post('/api/order').send(testUtils.orderReq).set('Authorization', `Bearer ${testUserAuthToken}`);
    const ordersRes = await request(app).get('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(ordersRes.status).toBe(200);
})

afterAll(async () => {
    const logOut = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logOut.status).toBe(200);
    expect(logOut.body.message).toBe('logout successful');
})