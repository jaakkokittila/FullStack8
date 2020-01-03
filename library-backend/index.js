const { ApolloServer,UserInputError, gql } = require('apollo-server')
const uuid = require('uuid/v1')
const mongoose = require('mongoose')
const Author = require('./models/author')
const User = require('./models/user')
const jwt = require('jsonwebtoken')
const Book = require('./models/book')
const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

mongoose.set('useFindAndModify', false)


const MONGODB_URI = 'mongodb+srv://fullstack:<SalasanaTähän>@cluster0-miwda.mongodb.net/fullStack8?retryWrites=true&w=majority'

const JWT_SECRET = 'salainenkoodi'

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })



const typeDefs = gql`

type Mutation {
    addBook(
        title: String!
        name: String!
        published: Int!
        genres: [String]!
    ): Book

    editAuthor(
        name: String!
        setBornTo: Int!
    ): Author

    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
}
type Book {
  title: String!
  published: Int!
  author: Author!
  genres: [String!]!
  id: ID!
}

type User {
  username: String!
  favoriteGenre: String!
  id: ID!
}


type Token {
  value: String!
}

  type Query {
    hello: String!
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]! 
    allAuthors: [Author!]!
    me: User
  }

  type Author {
      name: String!
      id: ID!
      born: Int
      bookCount: Int
  }

  type Subscription {
    bookAdded: Book!
  }
`

const resolvers = {
  Query: {
    bookCount: async () => {
      const books = await Book.find({})
     
      return books.length
    },
    authorCount: async () =>  {
      const authors = await Author.find({})
      return authors.length
    },
    allBooks: async (root, args) => {
        let books = await Book.find({})
        
        if(args.author === null && args.genre === null){
          return books
        }

        
        if(args.author !== undefined){
            books = books.filter(book => book.author === args.author)
        }

        if(args.genre !== undefined) {
            books = books.filter(book => book.genres.includes(args.genre))
        }
        
        return books

    },
    allAuthors: async () => await Author.find({}),
    me: (root, args, context) => {
      return context.currentUser
    },

    
  },

  Book: {
    author: async (root) => {
      const author = await Author.findById(root.author)
      return {
        name: author.name,
        born: author.born
      }
    }
  },

  Author: {

    bookCount: async (root, args) =>{
      let books = await Book.find({}) 
      books = books.filter(book => book.author == root.id)
      return books.length
    }
  },

   Mutation: {
    createUser: (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
  
      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'secret' ) {
        throw new UserInputError("wrong credentials")
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
    addBook : async (root, args, context) => {
      const authors = await Author.find({})
      const find = authors.find(author => author.name === args.name)
      const currentUser = context.currentUser


      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      
      var author = null
        if(!find){
             author = new Author ({
                name: args.name,
                born: null,
                id: uuid()
            })
          }else {
            author = find
          }

            try{
              const book = new Book({
                title: args.title,
                published: args.published,
                genres: args.genres,
                author: author,
                id: uuid()
              })
              await book.save()
             
              await author.save()
              pubsub.publish('BOOK_ADDED', {bookAdded: book})

              return book
              
            }catch(error){
              throw new UserInputError(error.message, {
                invalidArgs: args
              })
            }
           } ,

    editAuthor : async (root, args, context) => {
      const author = await Author.findOne({name: args.name})
      console.log(args.name)
      console.log(author)
      const newAuthor = {
        name: args.name,
        born: args.setBornTo,
        id: author.id
      }

      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      try{
        await Author.findByIdAndUpdate(author.id, newAuthor, {new: true})
      }catch(error){
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
        
     return  newAuthor
    }
   },
   Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    },
  }
 
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
})


server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})