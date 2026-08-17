import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/login?tab=signup')
  }, [navigate])

  return null
}
