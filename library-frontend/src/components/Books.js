import React , {useState} from 'react'

const Books = ({result, show}) => {
  const [genre, setGenre] = useState('')
  
 
  
  if (!show) {
    return null
  }

  if (result.loading) {
    return <div>loading...</div>
  }

  let books = result.data.allBooks

 
  let genres = []

  for (let i = 0; i < books.length; i++){
    for (let a = 0; a < books[i].genres.length; a++){
      if (!genres.includes(books[i].genres[a])){
        genres.push(books[i].genres[a])
      }
    }
  }
  
  if(genre !== ''){
   
    books = books.filter(book => book.genres.includes(genre))
  }
  
  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {books.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div>
        {genres.map(genre => <button key={genre} onClick={() => setGenre(genre)}>{genre}</button>)} <button onClick={() => setGenre('')}>All genres</button>
      </div>
    </div>
  )
}

export default Books