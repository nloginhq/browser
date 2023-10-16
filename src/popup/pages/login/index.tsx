import React, { ChangeEvent, useState, useEffect } from 'react'
import { Button, Dot, Image, Grid, Input, Link, Spacer, Text, Loading, Note } from '@geist-ui/core'
import { Unlock as UnlockIcon } from '@geist-ui/icons'
import { useNavigate } from 'react-router-dom'
import { browser } from 'webextension-polyfill-ts'

import { accountSvc } from '../../../service/account'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const now = new Date()
  accountSvc.initialize().then(() => {
    if (accountSvc.auth !== '' && accountSvc.authExpiry > now) {
      // already logged in
      navigate('/vault')
    }
  })

  useEffect(() => {
    browser.storage.local.get(['mainEmail']).then((result) => {
      if (result && result.mainEmail) {
        setEmail(result.mainEmail)
      }
    })
  }, [])

  const login = async () => {
    setSubmitted(true)
    setEmailError('')
    setPasswordError('')
    setLoginError('')

    let foundErr = false

    if (email == '') {
      setEmailError('required')
      foundErr = true
    }

    if (password == '') {
      setPasswordError('required')
      foundErr = true
    }

    if (!foundErr) {
      try {
        await accountSvc.login(password, email)
        navigate('/vault')
      } catch (e: any) {
        console.log(e)
        setLoginError(e.error)
      }
    }
    setSubmitted(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      login()
    }
  }

  const openNewTab = (url: string) => {
    chrome.tabs.create({ url })
  }

  return (
    <Grid.Container justify="center">
      <Grid xs={24} justify="center" pt={2.5}>
        <Image src="/img/icon48.png" alt="nlogin lock" draggable={false} mx={0} mt={0.6} />
      </Grid>
      <Grid xs={24} justify="center">
        <Input
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          enterKeyHint="done"
          width="300px"
          value={email}
        >
          Email
          {emailError !== '' && (
            <Grid xs={24} justify="center">
              <Dot type="warning">
                <Text small>{emailError}</Text>
              </Dot>
            </Grid>
          )}
        </Input>
      </Grid>
      <Grid xs={24} justify="center">
        <Input.Password
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          enterKeyHint="done"
          width="300px"
          autoFocus
        >
          Password
          {passwordError !== '' && (
            <Grid xs={24} justify="center">
              <Dot type="warning">
                <Text small>{passwordError}</Text>
              </Dot>
            </Grid>
          )}
        </Input.Password>
      </Grid>
      <Spacer h={2} />
      {submitted ? (
        <Grid xs={24} justify="center">
          <Loading />
        </Grid>
      ) : (
        <>
          <Grid xs={24} justify="center">
            <Button icon={<UnlockIcon />} type="success" width="200px" onClick={login}>
              Unlock
            </Button>
          </Grid>
          <Spacer h={0.5} />
          <Grid xs={24} justify="center">
            <Link
              href="https://nlogin.me/register"
              icon
              color
              onClick={(e) => {
                e.preventDefault()
                openNewTab('https://nlogin.me/register')
              }}
            >
              <Text small>Register Now</Text>
            </Link>
          </Grid>
        </>
      )}
      <Spacer />
      {loginError !== '' && (
        <Grid xs={24} justify="center">
          <Note type="error" label="error" filled>
            {loginError}
          </Note>
        </Grid>
      )}
    </Grid.Container>
  )
}
