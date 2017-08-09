# Reactive Google Firebase ORM
Reactive Google Firebase ORM

**!!! Alpha Version !!!**

https://github.com/component17/firebaseORM/wiki

# Methods
* create
* update
* delete
* find
* save
* query
* all


| method | params | description |
| ----- | ----- | ---------- |
| create |`params*`| Model object with data e.g `{title: "Post title", text: "new post"}`|
| update | `key*`, `params*` | update row with key `key` |
| delete | `key*` | remove row. if key not set, row will be removed with model key, if has call  after `Post.find()` e.g, or  manual setted by `Model.key = 'somekey'`|
| find | `key*`, `callback` | find row with key `key` |
| save | | save model |
| query | | see bottom for more info about query |
| all | `callback`| get all rows of table from the model |
#### all params with `*`  required

## Query
* Query setters
  * `where(value1, value2)`
  * `orderBy(field)`
  * `orderByKey(key)`
  * `limit(limit = 25)`
* Query getters
  * `first(callback)`
  * `last(callback)`
  * `get(callback)`

```
Post.where('New title').orderBy('pub_date').limit(10).get((posts) => {
    this.posts = posts;
});
```

# Example
### Posts.js
```js
'use strict'
const firebaseorm = require('@componet17/firebaseorm');

export default class Posts extends firebaseorm {
    constructor() {
        super();

        this.firebase = {
            apiKey: "",
            authDomain: "",
            databaseURL: "",
            projectId: "",
            storageBucket: "",
            messagingSenderId: ""
        };
        this.table = 'posts';
        /** with validation **/
        this.fields = {
            name: {
                required: true,
                type: Number,
                min: 3,
                max: 20
            },
            email: {
                required: true,
                type: 'email',
            },
            password: {
                required: true,
                type: String,
                regex: /^[a-z0-9]{6,32}$/i
            },
            phone: {
                required: false,
                type: Number,
                defaults: 89663632121
            }
        };
        /** without validation**/
        //this.fields = ['name', 'email', 'password', 'phone'];

        /** don't forget call __construct method! **/
        this.__construct();

    };

    user = () => {
        console.log('user');
        return this.belogonsTo('test', 'user');
    };

    MTM = () => {
        return this.belongsToMany('post-user', 'post', 'test');
    };

}
```

### Vue example
```
    import Posts from './Posts';
    export default {
        data() {
            return {
                posts: {},
                post: {}
            }
        },


        methods: {
             query() {
                //
             },
             manyToMany() {
                let Post = new Posts;
                let User = new Users;
                Post.find('-Kr0OupE6kfS38QDrJff').then((post) => {
                    User.find('-KqxS6Gm0vtBUJT-ng-3').then((user) => {
                        Post.MTM().attach(User);
                        //Post.MTM().attach(User2);
                        //Post.MTM().attach(User3);
                    });
                });
             },

             getManyToMany() {
                let Post = new Posts;
                let User = new Users;
                Post.find('-Kr0OupE6kfS38QDrJff').then((post) => {
                    Post.MTM().get((data) => {
                        console.log(data);
                    });
                });
            }

             belognsTo() {
                let User = new Users();
                User.find('-Kqw4Tvobvdr-RbtX8ZO').then((data) => {
                    let Post = new Posts();
                    Post.title = 123;
                    Post.text = `lorem50`;
                    Post.save().then((post) => {
                        Post.user().attach(User);
                    });

                }).catch((e) => {
                    console.error(e);
                })

            },

            findPost() {
                let Post = new Posts();
                /**
                    with callback for reactivity
                **/
                Post.find('-postid', (post) => {
                    //reactive update with callback
                    this.post = post;
                    // post = Post Model with data
                    // post.save(), post.delete() and any methods works
                }).then((post) => {
                    setTimeout(() => {
                        Post.title = "New title";
                        Post.save();
                    }, 10000); //this.post.title = "New title";
                });

                /**
                    just get post data
                **/
                Post.find('-badpostid').then((post) => {
                    this.post = post;
                }).catch( e =>  console.error(e);//row not found );

            },


            editPost() {
                Post.find('-postid').then((post) => {
                    Post.title = "New title";
                    Post.save();
                }).catch((e) => {
                    console.error(e);
                });
            }

            deletePost() {
                let Post = new Posts();
                Post.delete('-postid');
            },

            createPost() {
                let Post = new Posts();
                Post.title = "My first post";
                Post.text  = "lorem...";
                Post.save().then((post) => {
                    console.log(post);
                    this.post = post;
                }).catch((e) => {
                    console.error(e);
                });
            }
        }
    }
```