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
    title: `${faker.random.bs_adjective} ${faker.random.bs_noun}`,
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
    return runServer(TEST_DATABASE_URL);
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

  describe('GET endpoint', function() {

    it('return all exisitng blogpost', function(){

      let res;
      return chai.request(app)
      .get('/posts')
      .then(function(_res) {
        res = _res;
        res.should.have.status(200);
        res.body.blogposts.should.have.length.of.at.least(1);
        return BlogPost.count();
      })
      .then(function(count) {
        res.body.blogposts.should.have.length.of(count);
      });

    });

    it('return correct key and values', function(){

      let postRes;
      return chai.request(app)
      .get('/posts')
      .then(function(_res){
        _res.should.have.status(200);
        _res.body.blogposts.should.have.length.of.at.least(1);
        _res.should.be.json;
        _res.body.blogposts.should.be.a('array');

        _res.body.blogposts.forEach(function(post) {
          post.should.be.a('object');
          post.should.include.keys(
            'id', 'author', 'title', 'content', 'created'
          );
        });
        postRes = _res.body.blogposts[0];
        return BlogPost.findById(postRes.id);
      })
      .then(function(post) {

        postRes.id.should.equal(post.id);
        postRes.author.should.equal(post.author);
        postRes.title.should.equal(post.title);
        postRes.content.should.equal(post.content);
        postRes.created.should.equal(post.created);
      });

    });

  });



});
