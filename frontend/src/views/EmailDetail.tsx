import React from 'react'
import { useParams } from 'react-router-dom'

const EmailDetail: React.FC = () => {
  const { id } = useParams()

  return (
    <div>
      <h2>Email Detail</h2>
      <p>Email ID: {id}</p>
      <p>This is where the detailed email analysis will be displayed.</p>
      <p>Coming soon...</p>
    </div>
  )
}

export default EmailDetail 