import {Injectable, EventEmitter} from '@angular/core';
import 'rxjs/Rx';
import {Observable} from "rxjs/Observable";
import { User } from './user'
import { Events } from 'ionic-angular'
import { Uzer } from '../models/uzer'

import * as firebase from "firebase";
import 'firebase/auth'
import 'firebase/storage'
import 'firebase/database'
import 'firebase/messaging'




@Injectable()
export class FirebaseService {
  userCheck: EventEmitter<Boolean>
  authCallback: any;
  user:any
  ev:any
  constructor(public usr : User, public events: Events) {
    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyCYT5qaezgIxItyCT_idaM0rXNnKA9eBMY",
      authDomain: "dahlaq-c7e0f.firebaseapp.com",
      databaseURL: "https://dahlaq-c7e0f.firebaseio.com",
      projectId: "dahlaq-c7e0f",
      storageBucket: "dahlaq-c7e0f.appspot.com",
      messagingSenderId: "500593695235"
    };
    firebase.initializeApp(config);
    this.user=usr
    this.ev=events
    this.userCheck=new EventEmitter
    // check for changes in auth status


  }

  onAuthStateChanged(_function) {
      return firebase.auth().onAuthStateChanged((_currentUser) => {
          if (_currentUser) {
              console.log("User " + _currentUser.uid + " is logged in with " + _currentUser.providerData);
              _function(_currentUser);
          } else {
              console.log("User is logged out");
              _function(null)
          }
      })
  }





  getDatabase(url,once,uidn){
    if(uidn!==this.currentUser().uid){
      this.userCheck.emit(false)
    }else{
      this.userCheck.emit(true)
    }
    return new Promise(function(resolve,reject){
      if(!once){
      firebase.database().ref(url).on('value',function(snapshot){
        console.log(snapshot)
        resolve(snapshot)
      },function(err){
        console.log(err)
        reject(err)
      })
    }else{
      firebase.database().ref(url).once('value').then(function(res){
        console.log(res)
        resolve(res)
      }).catch(function(err){
        console.log(err)
        reject(err)
      })
    }
    })
  }
  setDatabase(url,value,set){
    return new Promise(function(resolve,reject){
      if(set){
      firebase.database().ref(url).set(value).then(function(res){
        console.log(res)
        resolve(res)
      }).catch(function(err){
        console.log(err)
        reject(err)
      })
    }else{
      firebase.database().ref(url).update(value).then(function(res){
        console.log(res)
        resolve(res)
      }).catch(function(err){
        console.log(err)
        reject(err)
      })
    }
    })
  }
  // getStorageUrl(url,){
  //   return new Promise(function(resolve,reject){
  //
  //   })
  // }
  getStorage(url){
    return new Promise(function(resolve,reject){
      var ref = firebase.storage().ref().child(url)
      ref.getDownloadURL().then(function(res){
        console.log(res)
        resolve(res)
      }).catch(function(err){
        console.log(err)
        reject(err)
      })
    })
  }
  setStorage(url,value){
    return new Promise(function(resolve,reject){
      firebase.storage().ref().child(url).put(value).then(function(res){
        console.log(res)
        resolve(res)
      }).catch(function(err){
        console.log(err)
        reject(err)
      })
    })
  }
  currentUser() {
      return firebase.auth().currentUser
  }
  createUser(creds, veri){
    var number= creds.digits;
    var num = this.user.checkify(number);
    var email = this.user.emailify(num)
    var password = this.user.passwordGen(number)
    var vm = this.linkToNumber
    var cr;
    console.log(email+"---"+password)
    return new Promise(function(resolve, reject){
      firebase.auth().createUserWithEmailAndPassword(email,password).then(function(d){
      console.log("Account creation successful, proceeding with phone number verification,",d)
      var user = firebase.auth().currentUser
      vm(num,veri).then(function(res){
        cr = res
        console.log(res)
        resolve(cr)
      })

    }).catch(function(err){
      console.log("Account not created",err)
      reject(null)
    })})

  }
  linkToNumber(number, verifier){
    console.log(verifier)
    var user = firebase.auth().currentUser;
    var cr;

    return new Promise(function(resolve, reject){user.linkWithPhoneNumber(number,verifier).then(function(result){
      cr=result
      console.log("Linked", result)
      resolve(cr)
    }).catch(function(err){
      user.delete().then(function(res){
        console.log("Account Deleted", res)
      }).catch(function(err){
        console.log("Error Deleteing account. Check Connection",err)
      })
      console.log("Link error",err)
      reject(null)
    })})
  }
  recaptcha(id) {
    //var recaptchaVerifier
    console.log(id)
    return new firebase.auth.RecaptchaVerifier(id, {
      "size": "invisible",
      "callback": function(response) {
      },

    })
  }
  logout() {
    return new Promise(function(resolve, reject){ firebase.auth().signOut().then(function(sucl) {
      console.log("logged out")
      resolve(sucl)
    }).catch(function(er) {
      console.log("no logging out...you're stuck :)", er)
      reject(er)
    })
  })
  }
  login(creds, verify) {
    var num = this.user.checkify(creds.digits)
    return new Promise(function(resolve,reject){
      firebase.auth().signInWithPhoneNumber(num, verify)
      .then(function(authData) {
        resolve(authData)
      })
      .catch(function(_error) {
        console.log("Login Failed!", _error);
        reject(_error)
      })
    })
  }

  uploadPhotoFromFile(_imageData, _progress) {


    return new Observable(observer => {
      var _time = new Date().getTime()
      var fileRef = firebase.storage().ref('images/sample-' + _time + '.jpg')
      var uploadTask = fileRef.put(_imageData['blob']);

      uploadTask.on('state_changed', function(snapshot) {
        console.log('state_changed', snapshot);
        _progress && _progress(snapshot)
      }, function(error) {
        console.log(JSON.stringify(error));
        observer.error(error)
      }, function() {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        var downloadURL = uploadTask.snapshot.downloadURL;

        // Metadata now contains the metadata for file
        fileRef.getMetadata().then(function(_metadata) {

          // save a reference to the image for listing purposes
          var ref = firebase.database().ref('images');
          ref.push({
            'imageURL': downloadURL,
            'thumb': _imageData['thumb'],
            'owner': firebase.auth().currentUser.uid,
            'when': new Date().getTime(),
            //'meta': _metadata
          });
          observer.next(uploadTask)
        }).catch(function(error) {
          // Uh-oh, an error occurred!
          observer.error(error)
        });

      });
    });
  }

  /*getDataObs() {
      var ref = firebase.database().ref('images')
      var that = this

      return new Observable(observer => {
          ref.on('value',
              (snapshot) => {
                  var arr = []

                  snapshot.forEach(function (childSnapshot) {
                      var data = childSnapshot.val()
                      data['id'] = childSnapshot.key
                      arr.push(data);
                  });
                  observer.next(arr)
              },
              (error) => {
                  console.log("ERROR:", error)
                  observer.error(error)
              });
      });
  }*/
}
