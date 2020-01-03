import React from 'react'

const Recommended = ({favoriteGenre, books, show}) => {

    if(!show){
        return null
    }



    if(favoriteGenre.loading || books.loading){
        return <div>loading...</div>
    }

    const genre = favoriteGenre.data.me.favoriteGenre

    const recommendedBooks = books.data.allBooks.filter(book => book.genres.includes(genre))

    return(
        <div>
            <h1>Recommended for you</h1>
            <ul>
                {recommendedBooks.map(book => <li key={book.title}>{book.title} {book.published}</li>)}
            </ul>
        </div>
    )


}

export default Recommended