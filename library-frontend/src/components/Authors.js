import React, { useState } from 'react'

const Authors = ({result, editAuthor, show}) => {
  const [name, setName] = useState('')
  const [setBornTo, setSetBornTo] = useState('')

  
  const submit = async (e) => {
    e.preventDefault()
    
    console.log(setBornTo)
    console.log(name)
    await editAuthor({
      variables: {name, setBornTo}
    })
    setName('')
    setSetBornTo('')
  }
  if (!show) {
    return null
  }

  if (result.loading) {
    return <div>loading...</div>
  }
  
  const names = result.data.allAuthors.map(author => <option key={author.name} value={author.name}>{author.name}</option>)

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {result.data.allAuthors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>
      <form onSubmit={submit}>
        <h2>Set birthyear</h2>
        Name: <select value={name} onChange={({target}) => setName(target.value)}>
            {names}
        </select>
        Born <input value={setBornTo} type="number"  onChange={({ target }) => setSetBornTo((parseInt(target.value)))} />
        <button type="submit">Set birthyear</button>
      </form>
    </div>
  )
}

export default Authors