import React, { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/Loginform'
import Recommended from './components/Recommended'
import  { gql } from 'apollo-boost'
import { useQuery, useMutation, useSubscription ,useApolloClient } from '@apollo/react-hooks'



const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    id
    title
    published
    genres
    author {
      name
      born
    }
  }
`
const ALL_BOOKS = gql`
{
  allBooks  {
    title
    author{
      name
    }
    published
    genres
  }
}
`
const ALL_AUTHORS = gql`
{
  allAuthors  {
    name
    born
    bookCount
    id
  }
}
`

const ME = gql`
{
  me {
    username
    favoriteGenre
  }
}
`

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`

const CREATE_BOOK = gql`
mutation createBook ($title: String!, $name: String!, $published: Int!, $genres: [String!]!){
  addBook(
    title: $title,
    name: $name,
    published: $published,
    genres: $genres
  ){
    ...BookDetails
  }
}
${BOOK_DETAILS}
`

const EDIT_AUTHOR = gql`
  mutation editAuthor ($name: String!, $setBornTo: Int!){
    editAuthor(
      name: $name,
      setBornTo: $setBornTo
    ){
      name
      born
    }
  }
`



const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`
const App = () => {
  const client = useApolloClient()
  const [page, setPage] = useState('authors')
  const [error, setError] = useState('')
  const [token, setToken] = useState(null)
  const [user, setUser] = useState('')
  const authors = useQuery(ALL_AUTHORS)
  const books = useQuery(ALL_BOOKS)
  const me = useQuery(ME)

  const handleError = (error) => {
    setError(error)

    setTimeout(() => {
      setError(null)
    }, 5000)
  }

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) => 
      set.map(p => p.id).includes(object.id)  

    const dataInStore = client.readQuery({ query: ALL_BOOKS })
    if (!includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks : dataInStore.allBooks.concat(addedBook) }
      })
    }   
  }
  

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  const [createBook] = useMutation(CREATE_BOOK, {
    onError: handleError,
    refetchQueries: [{query: ALL_BOOKS}]
  })

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded
      window.alert(`Added book ${subscriptionData.data.bookAdded.title}`)
      updateCacheWith(addedBook)
    }
  })
  

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{query: ALL_AUTHORS}]
  })

  const [login] = useMutation(LOGIN, {
    onError: handleError
  })

  let addBookButton = null
  let recommendedButton = null

if(token){
  addBookButton = <button onClick={() => setPage('add')}>add book</button>

}

if(user !== ''){
  recommendedButton = <button onClick={() => setPage('recommended')}>recommended</button> 
}





  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {addBookButton}
        {recommendedButton}
        <button onClick={() => setPage('login')}>login</button>
      </div>

      <p>{error}</p>

      <Authors result={authors} show={page === 'authors'} editAuthor={editAuthor}/>
      

      <Books
        result={books}
        show={page === 'books'}
      />
  
      <NewBook
        addBook={createBook}
        show={page === 'add'}
      />

      <Recommended show={page === 'recommended'} books={books} favoriteGenre={me} />

      <LoginForm
          show={page ==='login'}
          login={login}
          setUser={(user) => setUser(user)}
          setToken={(token) => setToken(token)}
        />
      <button onClick={logout}>Log out</button>
    </div>
  )
}

export default App