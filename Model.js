import firebase from 'firebase';
import Vue from 'vue';
export class moModeldel {
    constructor(fields, table) {
        this.db = window.firebase;
        this.app = Vue;
        if (!firebase.apps.length) {

            firebase.initializeApp({

            });
        }

        this.fields = fields;
        this.table = table;

        for(let key in this.fields) {
            if(typeof this.fields[key] === "object") {
                this[key] = this.fields[key].hasOwnProperty('defaults') ? this.fields[key].defaults : '';

            } else {
                this[this.fields[key]] = '';
            }
        }

    }

     getErrors() {
        return this.errors;
    }


     getErrorFields() {
        return this.error_fields;
    }

    save() {
        let params = {};
        for(let key in this.fields) {
            params[this.fields[key]] = this[this.fields[key]]
        }

        let result = false;
        if(this.key) {
            result = this.update(this.key, params);
        } else {
            result = this.create(params);
        }

        for(let key in this.fields) {
            params[this.fields[key]] = null;
        }

        return result;
    }


    manyToMany(__table, __from, __to) {

    }


    hasMany(__table, __key, callback) {
        let self = this;


        return {
            get(callback) {

                firebase.database().ref(__table).orderByChild("rel_"+__key).equalTo(self.key).on('value', (snap) => {
                    let obj = snap.val();
                    let result = [];
                    self[__table] = [];
                    for(let key in obj) {
                        let data = Object.assign({}, obj[key], {key: key});
                        result.push(data);
                        self[__table].push(data);

                    }

                    callback(result);
                })
            }
        }
    }


    belogonsTo(__table, __key) {
        let self = this;

        return {
            get: function (callback) {
                let id = self['rel_'+__key];
                firebase.database().ref(__table+"/"+id).on('value', (snap) => {
                    let object = snap.val();
                    self[__key] = {};
                    for(let key in object) {
                        self[__key][key] = object[key];
                    }
                    self[__key]['key'] = snap.key;
                    callback(self);
                });
            },

            attach: function (model) {
                let update = {};
                update["rel_" + __key] = model.key;
                self["rel_" + __key] = model.key;
                firebase.database().ref(self.table + "/" + self.key).update(update);
            },

            dettach: function () {
                let update = {};
                update["rel_" + __key] = null;
                firebase.database().ref(self.table + "/" + self.key).update(update);

            }

        };

    }

    all(callback) {
        this.db.child(this.table).on('value', (snap) => {
            callback(snap.val());
        });
    }

    find(id, callback) {
        let self = this;

        console.log(this.table + "/" + id);
        return new Promise((resolve, reject) => {
            let method = typeof callback === "function" ? 'on' : 'once';
            firebase.database().ref(this.table + "/" + id)[method]('value', (snap) => {

                let snapshot = snap.val();

                if(snapshot) {
                    let result = {};
                    for(let key in snapshot) {
                        self[key] = snapshot[key];
                        result[key] = snapshot[key];
                    }
                    result.key = snap.key;
                    self.key = snap.key;
                    if(typeof callback === "function") {
                        callback(result);
                    }
                    resolve(this);
                } else {
                    reject("row not found")
                }
            })
        })

    }

    /*query() {
     if(arguments.length === 1) {
     return this.where({}, arguments[0]);
     } else {
     return this.where(arguments[0], arguments[1]);
     }
     }*/

    query() {
        const query = firebase.database().ref(this.table);
        let gf = `query`;

        let o = {};

        o.where = function (value, value2) {
            if(value2 === undefined) {
                gf = (typeof value === 'string') ? gf + `.equalTo('${value}')` :
                    (typeof value === 'number') ? gf + `.equalTo(${value})` : gf;
            } else {
                gf += `.startAt(${value}).endAt(${value2})`
            }
            return this;
        };

        o.orderBy = function (field) {
            gf = gf + `.orderByChild('${field}')`;
            return this;
        };

        o.orderByKey = function() {
            gf += ".orderByKey()";

            return this;
        };


        o.first = function (callback) {

            if(gf.indexOf('.equalTo(') > -1 && gf.indexOf('.orderBy') === -1) {
                throw new Error("'Where' param called, but orderBy param missed")
            }

            gf += ".limitToFirst(1)";

            eval(gf).on('child_added', (snap) => {
                console.log(snap);
                callback(Object.assign({}, {key: snap.key}, snap.val()));
            })
        };

        o.last = function (callback) {
            if(gf.indexOf('.equalTo(') > -1 && gf.indexOf('.orderBy') === -1) {
                throw new Error("'Where' param called, but orderBy param missed")
            }

            gf += ".limitToLast(1)";

            eval(gf).on('child_added', (snap) => {
                console.log(snap);
                callback(Object.assign({}, {key: snap.key}, snap.val()));
            })
        };

        o.limit = function (limit = 25) {

            gf += `.limitToFirst(${limit})`;
            return this;
        };


        o.get = function (callback = null) {
            console.log(gf);
            let method = callback ? 'on' : 'once';

            return new Promise((resolve, reject) => {
                eval(gf)[method]('value', (snap) => {
                    let result = [];

                    let obj = snap.val();
                    for(let key in obj) {
                        let data = Object.assign({}, obj[key], {key: key});
                        result.push(data);
                    }

                    if(typeof callback === 'function')
                        callback(result);

                    resolve(result);
                })
            });

        };

        return o;
    }


    create(params = null) {

        if(params === null) {
            params = {};
            for(let key in this.fields) {
                if(typeof this.fields[key] === "object") {
                    params[key] = this[key];
                } else {
                    params[this.fields[key]] = this[this.fields[key]];
                }
            }
        }

        return new Promise((resolve, reject) => {

            if(this.validParams(params) === false) {
                reject(this.getErrors());
            } else {
                this.key = firebase.database().ref(this.table).push(params).key;
                resolve(this.key);
            }
        });

    }


    update(key, params) {
        this.validParams(params);

        return new Promise((resolve, reject) => {
            firebase.database().ref(this.table + "/" + key).update(params);
            resolve(this);
        });

    }


    delete(key = null) {

        if(key === null) {
            if(this.key) {
                key = this.key;
            } else {
                throw new Error("key missed")
            }
        }

        return new Promise((resolve, reject) => {
            firebase.database().ref(this.table + "/" + key).remove();
            resolve();
        });
    }


    validParams(params) {
        if (params === undefined) {
            throw new Error("Undefined params");
        }

        if (typeof params !== "object") {
            throw new Error("Params must be object")
        }


        console.log(this.fields);

        let f = this.fields;

        let errors = [],
            error_fields = [];

        for(let key in f) {
            let row = f[key];
            console.log("key", key);
            console.log("row", row);
            if(typeof row === "object") {

                if(row.hasOwnProperty('required')) {
                    if(row.required && !this[key]) {
                        errors.push("Пропущено обязательное поле " + key);
                        error_fields.push(key);
                    }
                }

                if(row.hasOwnProperty('type')) {
                    switch(row.type) {
                        case 'email':
                            let re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

                            if(re.test(this[key]) === false) {
                                errors.push(`Ошибка валидации email в поле ${key}`);
                                error_fields.push(key);
                            }

                            break;

                        case String:
                            if(typeof this[key] !== 'string' && row.hasOwnProperty('required') && row.required === true) {
                                errors.push(`Тип поля ${key} должен быть String`);
                                error_fields.push(key);
                            }
                            break;

                        case Number:
                            if(typeof this[key] !== 'number' && row.hasOwnProperty('required') && row.required === true) {
                                errors.push(`Тип поля ${key} должен быть Number`);
                                error_fields.push(key);
                            }
                            break;
                    }
                }

                if(row.hasOwnProperty('min')) {
                    console.log(this);
                    let string = this[key];
                    console.log(typeof string);
                    if(row.min && string.length < row.min) {
                        errors.push(`Минимальная длина поля ${key} ${row.min} символов`);
                        error_fields.push(key);
                    }
                }


                if(row.hasOwnProperty('max')) {
                    if(row.min && this[key].length > row.max) {
                        errors.push(`Максимальная длина поля ${key} ${row.min} символов`);
                        error_fields.push(key);
                    }
                }


                if(row.hasOwnProperty('regex')) {
                    if(row.regex.test(this[key]) === false) {
                        errors.push(`Поле ${key} не прошло валидацию`);
                        error_fields.push(key);
                    }
                }


            }
        }

        if(errors.length) {
            this.errors = errors;
            this.error_fields = error_fields;

            for(let key in errors) {
                console.error(errors[key]);
            }
            return false;
        }


        return true;

    }

}