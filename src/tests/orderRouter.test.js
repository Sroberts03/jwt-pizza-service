const request = require('supertest');
const app = require('../service');
const testUtils = require('./testUtils');
const {orderReq} = require("./testUtils");

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

test('addMenuItem - unauthorized', async () => {
    const newItem = { description: 'Test Item', price: 9.99 };
    const addRes = await request(app).put('/api/order/menu').send(newItem).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(addRes.status).toBe(403);
    expect(addRes.body.message).toBe('unable to add menu item');
})

// test('addMenuItem - authorized', async () => {
//     const adminToken = await testUtils.loginAdminUser(app);
//     const newItem = { description: 'Test Item', price: 9.99 };
//     const addRes = await request(app).put('/api/order/menu').send(newItem).set('Authorization', `Bearer ${adminToken}`);
//     expect(addRes.status).toBe(200);
//     expect(Array.isArray(addRes.body)).toBe(true);
//     expect(addRes.body.find(i => i.description === newItem.description && i.price === newItem.price)).toBeDefined();
// })

test('createOrder', async () => {
    const loginToken = await testUtils.loginUser(app, testUser);
    const orderRes = await request(app).post('/api/order').send(testUtils.orderReq).set('Authorization', `Bearer ${loginToken}`);
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.order).toMatchObject(orderReq);
    expect(orderRes.body.order.id).toBeDefined();
    expect(orderRes.body.jwt).toBeDefined();
})

test('getOrders', async () => {
    const loginToken = await testUtils.loginUser(app, testUser);
    await request(app).post('/api/order').send(testUtils.orderReq).set('Authorization', `Bearer ${loginToken}`);
    const ordersRes = await request(app).get('/api/order').set('Authorization', `Bearer ${loginToken}`);
    expect(ordersRes.status).toBe(200);
})

afterAll(async () => {
    const logOut = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logOut.status).toBe(200);
    expect(logOut.body.message).toBe('logout successful');
})