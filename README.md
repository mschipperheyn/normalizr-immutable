Normalizr-Immutable is an opiniated immutable version of Dan Abramov's [Normalizr](https://github.com/gaearon/normalizr) and Facebook's [Immutable](https://facebook.github.io/immutable-js).
We recommend reading the documentation for Normalizr and Immutable first, to get a basic idea of the intent of these concepts.

### Installation
```
npm install normalizr-immutable
```

### What does Normalizr-Immutable do?
It normalizes a deeply nested json structure according to a schema for Redux apps and makes the resulting object immutable.
It does this in a way that preserves the ability to reference objects using traditional java object notation.
So, after normalizing an object, you can still treat the normalized object as a traditional java object:

Before normalization
```json
"article": {
  "id": 1,
  "txt": "Bla",
  "user":{
    "id":15,
    "name":"Marc"
  }
}
```

After normalization
```javascript
const normalized = {
  entities:{//Record
    articles: {//Record
      1: {//Record
        id:1,
        txt: 'Bla',
        user: 15 //Optionally a proxy
      }
    },
    users:{//Record
      15:{//Record
        id:15,
        name:'Marc'
      }
    }
  },
  result:[1]//List
}
```

If you use Redux, it optionally, allows you to reference the normalized object through a proxy. This should also work in other environments, but this has not been tested.
This allows you to say:

```
normalized.entities.articles[1].user.name
```

### How is this different from Normalizr?
* Normalizr-Immutable is immutable
* Normalizr puts an id in the place of the object reference, Normalizr-Immutable (optionally) places a proxy there so you can keep using the object as if nothing changed.
* Normalizr-Immutable adds an extra attribute to a schema: Record. This is an Immutable Record that defines the contract for the referenced 'class'.

### What are the benefits of Normalizr-Immutable?
* Because each Schema uses a Record to define its contract, there is a clearly understandable and visible contract that any developer can read and understand.
* Because Record defines defaults, any unexpected changes to the incoming json structure will be less likely to create unforeseen errors and it will be easier to identify them.
* It gives you the benefit of immutability without sacrificing the convenience of object.property access.
* When you render your data, you don't want to retrieve objects separately for normalized references or marshal your normalized object back into a denormalized one. The use of the Proxy allows you to use your normalized structure as if it was a normal object.
* You can transition to using immutable with minimal changes.

### How about Maps, Lists, etc?
Normalizr-Immutable uses Records where possible in order to maintain object.property style access. Sequences are implemented through Lists.
If you defined an object reference on your to-be-normalized object, it will be processed as a Record if the property has a Schema defined for it. Otherwise, it will become a Map (and require object.get('property') style access).

When you work with Lists and Maps, such as with loops, you should use es6 style .forEach etc instead of for...in, for...of. Obviously, the latter will not work.

### Creating a schema
Creating a schema is the same as originally in Normalizr, but we now add a Record to the definition. Please note that you need to use arrayOf, unionOf and valuesOf of Normalizr-Immutable.

```javascript
import { Record, List, Map } from 'immutable';
import { Schema, arrayOf } from 'normalizr-immutable';

const Article = new Record({
  id:null,
  txt:null,
  user: null
});

const User = new Record({
  id:null,
  name:null
});

const Tag = new Record({
  id:null,
  label:null
});

const schemas = {
  article : new Schema('articles', { idAttribute: 'id', record: Article }),
  user    : new Schema('users', { idAttribute: 'id', record: User  }),
  tag     : new Schema('tags', { idAttribute: 'id', record: Tag  })
};

schemas.article.define({
  user    : schemas.user,
  tags    : arrayOf(schemas.tag)
});

```

### Normalizing your dataSource
Normalizing data is executed as follows.

```javascript
import { normalize, arrayOf } from 'normalizr-immutable';

const normalized = normalize(json, arrayOf(schemas.article),{});
```

### Working with Proxies
Normally, if you normalize an object, the resulting structure will look something like this (All the Object definitions except for `List` are `Record` implementations).

```javascript
new NormalizedRecord({
  result: new List([1, 2]),
  entities: new EntityStructure({
    articles: new ValueStructure({
      1: new Article({
        id      : 1,
        title   : 'Some Article',
        author  : 1,
        tags    : new List([5])
      })
    }),
    users: new ValueStructure({
      1: new User({
        id: 1,
        name: 'Dan'
      })
    }),
    tags: new ValueStructure({
      5: new Tag({
        id:5,
        label:'React'
      })
    })
  })
})

```

So, if you're rendering an Article, in order to render the associated user, you will have to retrieve it from the entity structure. You could do this manually, or you could de-normalize/marshal your structure when you retrieve it for rendering. But this can be expensive.

For this purpose, we introduce the proxy. The idea, is that you can simply reference `articles[1].user.name`. The proxy will take care of looking up the related object.

Please note that `Proxy` support is not yet consistent across browsers and can also give headaches in testing environments with incomplete support (I've had stuff like infinite loops happen using node-inspector, etc). Tread with care.

So, with the proxy, an Article Record essentially looks like this:

```javascript
new Article({
  id      : 1,
  title   : 'Some Article',
  author  : new Proxy({id:1}),
  tags    : new List([new Proxy({id:5})])
})
```

In order to use the proxy, you will need to give it access to the actual object structure. We have developed this feature testing against Redux, so we pass it the getState function reference and the reference to the reducer inside the state structure.

```javascript
const normalized = normalize(json.articles.items, arrayOf(schemas.article),{
  getState,
  reducerKey:'articleReducer'
});
```

Please note that we pass `getState` and not `getState()`. `getState` is a function reference to the method that will return the current state of the Redux store. If you are using Redux, you can get a reference to this method like so

```javascript
export function loadArticles(){

  return ( dispatch, getState) => {
    [...]

    const normalized = normalize(json, schema,{
      getState,
      reducerKey:'articleReducer'
    });

    [...]
  }
}
```

`articleReducer` in this case, is the name of the reducer. Currently we assume that the `result` and `entitites` keys are available in the root of the referenced reducer. This will be made more flexible in future versions.

### Examples
I still have to write examples, but for now check out the tests to get an idea of how it works.

### Browser support
This library has currently only been tested against React-Native, so I would like to hear about experiences in the browser. For a list of browsers with appropriate Proxy support [http://caniuse.com/#feat=proxy](http://caniuse.com/#feat=proxy).

### Final remarks
The use of the Proxy as a way of accessing the entity structure transparently, would be totally possible also in the original Normalizr library as well. I'm still studying on ways to override functions in a non class structure. If anyone has any suggestions on this, I could spin off the Proxy functionality into a separate library that could serve both libraries.

The way I turn a list of entities into Records (the ValueStructure Record) is a bit of a hack. I basically create the Record with the actual values as defaults, which is not the way you should be using Records. I apply this hack to ensure that we can keep referencing objects through dot notation. If someone has any problems with this in terms of performance, I would like to hear about it.

### TODO
* API description
* Examples

### Troubleshooting
* If you get any error message with regards to the Proxy object being unknown, please make sure you have set up your babel presets correctly to support proxies. If you use mocha for testing, you will need to add `--harmony-proxies` to the mocha command
* If you get unexpected results, please check that you are not accidently using arrayOf, unionOf and valuesOf of the original Normalizr library. Because this library doesn't export some of the components these functions use, I had to copy them and they will fail instanceof even though they are functionally equivalent.
