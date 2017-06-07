'use strict';
const mongoose = require('mongoose');
const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const {BlogPost} = require('../models');
const {TEST_DATABASE_URL} = require('../config');
const {app,runServer,closeServer} = require('../server');

chai.use(chaiHttp);

function generateBlogs(){
  return{
    author:{
      firstName:faker.name.firstName(),
      lastName:faker.name.lastName()
    },
    content:faker.lorem.paragraph(),
    title: `${faker.random.bs_adjective()} ${faker.random.bs_noun}`,
    created: faker.date.recent()
  };
}
function seedData(){
  const dataArr = [];
  for(let i = 0; i < 10; i++){
    dataArr.push(generateBlogs());
  }
  return BlogPost.insertMany(dataArr);
}
function tearDB(){
  console.warn('SOS CLOSING DATABASE SOS!');
  return mongoose.connection.dropDatabase();
}

describe('Testing blog database',function(){
  before(function(){
    return runServer();
  });
  beforeEach(function(){
    return seedData();
  });
  afterEach(function(){
    return tearDB();
  });
  after(function(){
    return closeServer();
  });

  
});