import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

function decodeToken(token) {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        )
        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null)
    const [userId, setUserId] = useState(null)

    useEffect(() => {
        const savedToken = localStorage.getItem('token')
        if (savedToken) {
            setToken(savedToken)
            const decoded = decodeToken(savedToken)
            if (decoded) setUserId(decoded.id)
        }
    }, [])

    function login(tokenReceived) {
        localStorage.setItem('token', tokenReceived)
        setToken(tokenReceived)
        const decoded = decodeToken(tokenReceived)
        if (decoded) setUserId(decoded.id)
    }

    function logout() {
        localStorage.removeItem('token')
        setToken(null)
        setUserId(null)
    }

    return (
        <AuthContext.Provider value={{ token, userId, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}