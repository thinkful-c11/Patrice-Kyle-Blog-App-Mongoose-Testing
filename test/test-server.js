'use strict';
const mongoose = require('mongoose');
const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const chaiMoment = require('chai-moment');

const {BlogPost} = require('../models');
const {TEST_DATABASE_URL} = require('../config');
const {app,runServer,closeServer} = require('../server');

chai.use(chaiHttp);
chai.use(chaiMoment);
function generateBlogs(){
  //console.log(`${generateAdj()||generateVerbs()} ${generateNoun()}`)
  return{
    author:{
      firstName:faker.name.firstName(),
      lastName:faker.name.lastName()
    },
    content:faker.lorem.paragraph(),
    title: `${generateAdj()||generateVerbs()} ${generateNoun()}`,
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
function separateName(str){
  return str.split(' ');
}
//GENERATE NOUNS VERBS ADJ
function generateNoun(){
  return ['Puppy','Cat','Shiba','Rabbit'][Math.floor(Math.random()*4)];
}
function generateAdj(){
  return ['Cool','Swag','Lazy',false][Math.floor(Math.random()*4)];
}
function generateVerbs(){
  return ['Send','Play with','Love a','Adopt a'][Math.floor(Math.random()*4)];
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
        //console.log("HEre",res.body);
        res.body.should.have.length.of.at.least(1);
        return BlogPost.count();
      })
      .then(function(count) {
        res.body.should.have.lengthOf(count);
      });

    });

    it('return correct key and values', function(){

      let postRes;
      return chai.request(app)
      .get('/posts')
      .then(function(_res){
        _res.should.have.status(200);
        _res.body.should.have.length.of.at.least(1);
        _res.should.be.json;
        _res.body.should.be.a('array');

        _res.body.forEach(function(post) {
          post.should.be.a('object');
          post.should.include.keys(
            'id', 'author', 'title', 'content', 'created'
          );
        });
        postRes = _res.body[0];
        return BlogPost.findById(postRes.id);
      })
      .then(function(post) {
        // console.log(post);
        //  console.log('here',postRes);
        const authorName = separateName(postRes.author);
        postRes.id.should.equal(post.id);
        authorName[0].should.equal(post.author.firstName);
        authorName[1].should.equal(post.author.lastName);
        postRes.title.should.equal(post.title);
        postRes.content.should.equal(post.content);
        postRes.created.should.be.sameMoment(post.created);
      });
    });
  });

  describe('Post endpoint',function(){
    it('return a new blog post',function(){
      let newPost = generateBlogs();
      return chai
      .request(app)
      .post('/posts')
      .send(newPost)
      .then(function(_res){
        _res.should.have.status(201);
        _res.should.be.json;
        _res.body.should.be.a('object');
        _res.body.should.include.keys('id','title','content','author','created');
        _res.body.id.should.not.be.null;
        _res.body.title.should.not.be.undefined;
        _res.body.author.should.not.be.undefined;
        _res.body.content.should.not.be.undefined;
        newPost = _res.body;
        return BlogPost.findById(_res.body.id);
      })
      .then(function(newPostResult){
        //console.log(newPost);
        //console.log('gblalfakslk',newPostResult);
        const authorName = separateName(newPost.author);
        newPost.id.should.be.equal(newPostResult.id);
        authorName[0].should.equal(newPostResult.author.firstName);
        authorName[1].should.equal(newPostResult.author.lastName);
        newPost.title.should.equal(newPostResult.title);
        newPost.content.should.equal(newPostResult.content);
        newPost.created.should.be.sameMoment(newPostResult.created);
      });
    });
  });

  describe('PUT endpoint', function() {

    it('update blog post',function() {
      const updateData = {
        title:'Sugar Cubes',
        author:{
          firstName: 'Sally',
          lastName: 'Brown'
        },
        content: 'They are sweeT!'
      };
      return BlogPost
        .findOne()
        .exec()
        .then(function(post) {
          updateData.id = post.id;
          updateData.created = post.created;
          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(function(_res) {
          _res.should.have.status(201);
          _res.should.be.json;
          _res.should.be.a('object');
          const authorName = separateName(_res.body.author);
          _res.body.title.should.equal(updateData.title);
          _res.body.id.should.equal(updateData.id);
          authorName[0].should.equal(updateData.author.firstName);
          authorName[1].should.equal(updateData.author.lastName);
          _res.body.content.should.equal(updateData.content);
          _res.body.created.should.be.sameMoment(updateData.created);
        });

    });
  });

});
