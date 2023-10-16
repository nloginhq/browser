import {
  Badge,
  Button,
  Collapse,
  Dot,
  Grid,
  Input,
  Modal,
  Note,
  Spacer,
  Text,
  Toggle,
  useModal,
  useTheme,
} from '@geist-ui/core'
import { ToggleEvent } from '@geist-ui/core/esm/toggle'
import { Check, Copy, Key, Mail, RefreshCw, User } from '@geist-ui/icons'
import { ChangeEvent, useState } from 'react'
import GeneratePassword from '../../../components/generate-password'
import { client, UnencryptedCredential } from '../../../service/client'
import Copiable from '../../../components/copiable'
import { useSWRConfig } from 'swr'

const CredDetails = ({ cred, current }: { cred: UnencryptedCredential; current: string }) => {
  const theme = useTheme()
  const [usernameCopied, setUsernameCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)

  const copyToClipboard =
    (value: string, setter: React.Dispatch<React.SetStateAction<boolean>>) =>
    (event: React.MouseEvent) => {
      event.stopPropagation()
      event.preventDefault()
      navigator.clipboard.writeText(value)
      setter(true)
      setTimeout(() => {
        setter(false)
      }, 2000)
    }

  const sendClickToFill = async (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    chrome.runtime.sendMessage({ query: 'fill', cred: cred })
  }

  const toggleStatus = async (event: ToggleEvent) => {
    const status = event.target.checked ? 'active' : 'inactive'
    client.setEmailStatus(cred.email, status)
  }

  return (
    <Grid.Container>
      <Grid.Container sm={24}>
        <Grid sm={10} xs={24}>
          <Text>{cred.email}</Text>
        </Grid>
        <Grid.Container justify="flex-end" sm={14} xs={24}>
          <Button
            iconRight={usernameCopied ? <Check /> : <User />}
            type="secondary"
            ghost
            auto
            marginRight={0.5}
            height={'2.5em'}
            title="Copy username"
            onClick={copyToClipboard(cred.username, setUsernameCopied)}
          />
          <Button
            iconRight={emailCopied ? <Check /> : <Mail />}
            type="secondary"
            ghost
            auto
            marginRight={0.5}
            height={'2.5em'}
            title="Copy email"
            onClick={copyToClipboard(cred.email, setEmailCopied)}
          />
          <Button
            iconRight={passwordCopied ? <Check /> : <Key />}
            type="secondary"
            ghost
            auto
            title="Copy password"
            height={'2.5em'}
            onClick={copyToClipboard(cred.password, setPasswordCopied)}
          />
        </Grid.Container>
      </Grid.Container>
      {cred.email.endsWith('@nlogin.me') && (
        <Grid.Container
          alignItems="center"
          justify="flex-end"
          className="email-status"
          sm={24}
          mt={0.5}
        >
          <Grid>
            <Badge style={{ backgroundColor: theme.palette.foreground }}>
              email forwarding enabled
            </Badge>
            <Toggle
              marginLeft={1}
              title="Disable email"
              checked={cred.emailStatus === 'active'}
              onChange={toggleStatus}
            />
          </Grid>
        </Grid.Container>
      )}
      {cred.uri.toLowerCase().includes(current) && (
        <Button shadow type="success" width="100%" mt={0.5} onClick={sendClickToFill}>
          Click to fill
        </Button>
      )}
    </Grid.Container>
  )
}

// individual credential
const Credential = ({ cred, current }: { cred: UnencryptedCredential; current: string }) => {
  const theme = useTheme()
  const { mutate } = useSWRConfig()
  const { visible, setVisible, bindings } = useModal()
  const [uri, setURI] = useState(cred.uri)
  const [username, setUsername] = useState(cred.username)
  const [password, setPassword] = useState(cred.password)
  const [showCredPasswordGenerate, setShowCredPasswordGenerate] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [warnURI, setWarnURI] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const changeURI = (e: ChangeEvent<HTMLInputElement>) => {
    setURI(e.target.value)
  }

  const changeUsername = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
  }

  const changePassword = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  const updateCred = async () => {
    setSubmitted(true)
    setWarnURI(false)
    if (uri === '') {
      setWarnURI(true)
      setSubmitted(false)
      return
    }
    const updated: UnencryptedCredential = {
      id: cred.id,
      username: username,
      email: cred.email, // ignored
      emailStatus: 'undefined', // ignored
      password: password,
      uri: uri,
    }
    try {
      await client.updateCredential(updated)
      mutate('/credentials')
      setShowCredPasswordGenerate(false)
    } catch (e: any) {
      console.log('failed to update credential: ' + e)
      setError(e.error)
    }
    setSubmitted(false)
  }

  const deleteCred = async () => {
    setSubmitted(true)
    try {
      await client.deleteCredential(cred)
      mutate('/credentials')
    } catch (e: any) {
      console.log('failed to delete credential: ' + e)
      setError(e.error)
    }
    setSubmitted(false)
    setVisible(false)
  }

  const revert = () => {
    setURI(cred.uri)
    setUsername(cred.username)
    setPassword(cred.password)
    setShowCredPasswordGenerate(false)
  }

  const copy = (val: string) => {
    navigator.clipboard.writeText(val)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <>
      <Grid justify="center" marginTop={0.5} key={cred.uri + '_' + cred.email} width={'100%'}>
        <Collapse
          shadow
          title={cred.uri}
          subtitle={<CredDetails cred={cred} current={current} />}
          width="100%"
          className="cred-card"
          style={{ overflow: 'hidden' }}
        >
          <Grid.Container gap={1}>
            {warnURI && (
              <Grid xs={24}>
                <Dot type="warning">
                  <Text small>website is required</Text>
                </Dot>
              </Grid>
            )}
            <Grid xs={24}>
              <Input
                label="website"
                value={uri}
                onChange={changeURI}
                iconRight={<Copiable val={cred.uri} />}
                iconClickable
                width="100%"
              />
            </Grid>
            <Grid xs={24}>
              <Input
                label="username"
                value={username}
                onChange={changeUsername}
                iconRight={<Copiable val={cred.username} />}
                iconClickable
                width="100%"
              />
            </Grid>
            <Grid xs={24}>
              <Input
                label="email"
                readOnly
                value={cred.email}
                iconRight={<Copiable val={cred.email} />}
                iconClickable
                width="100%"
              />
            </Grid>
          </Grid.Container>
          <Grid.Container gap={1}>
            <Grid sm={22} xs={0}>
              <Input.Password
                label="password"
                value={password}
                onChange={changePassword}
                width="93%"
              />
            </Grid>
            <Grid sm={0} xs={8}>
              <Button type="secondary" disabled auto scale={0.8}>
                password
              </Button>
            </Grid>
            <Grid sm={2} xs={16} justify="flex-end">
              <Button
                type="secondary"
                ghost
                iconRight={copied ? <Check /> : <Copy />}
                auto
                scale={0.8}
                onClick={() => copy(cred.password)}
              />
              <Button
                type="secondary"
                iconRight={<RefreshCw />}
                auto
                scale={0.8}
                ml={0.25}
                onClick={() => setShowCredPasswordGenerate(!showCredPasswordGenerate)}
              />
            </Grid>
          </Grid.Container>
          {showCredPasswordGenerate && (
            <>
              <Spacer h={1} />
              <GeneratePassword setPassword={setPassword} />
            </>
          )}
          {error !== '' && (
            <Grid xs={24} justify="center">
              <Spacer h={0.5} />
              <Note type="error" label="error" filled>
                {error}
              </Note>
            </Grid>
          )}
          <Spacer h={1} />
          <Grid.Container gap={1}>
            <Grid xs={12}>
              <Button type="success" ghost width="100%" onClick={updateCred} disabled={submitted}>
                Update
              </Button>
            </Grid>
            <Grid xs={12}>
              <Button type="secondary" ghost width="100%" onClick={revert} disabled={submitted}>
                Cancel
              </Button>
            </Grid>
            <Grid xs={24} justify="flex-end">
              <Button
                type="error"
                ghost
                width="100%"
                disabled={submitted}
                onClick={() => setVisible(true)}
              >
                Delete
              </Button>
            </Grid>
          </Grid.Container>
        </Collapse>
      </Grid>
      <Modal disableBackdropClick {...bindings}>
        <Modal.Title style={{ textTransform: 'none' }}>Delete {cred.uri}</Modal.Title>
        <Modal.Content>
          <Text>
            Are you sure you want to delete your login details? This can&apos;t be undone.
          </Text>
          {error !== '' && (
            <Grid xs={24} justify="center">
              <Spacer h={0.5} />
              <Note type="error" label="error" filled>
                {error}
              </Note>
            </Grid>
          )}
        </Modal.Content>
        <Modal.Action passive disabled={submitted} onClick={() => setVisible(false)}>
          Cancel
        </Modal.Action>
        <Modal.Action
          onClick={deleteCred}
          disabled={submitted}
          style={{ backgroundColor: theme.palette.success }}
        >
          I&apos;m sure
        </Modal.Action>
      </Modal>
    </>
  )
}

// list of credentials
const Credentials = ({ creds, filter }: { creds: UnencryptedCredential[]; filter: string }) => {
  let sortedCreds = creds?.sort(function (a, b) {
    if (a.id > b.id) {
      return 1 // a greater than b
    }
    if (a.id < b.id) {
      return -1 // a less than b
    }
    // a must be equal to b
    return 0
  })

  const filterByWebsiteOrTitleOrEmail = (
    cred: UnencryptedCredential,
    index: number,
    creds: UnencryptedCredential[],
  ): boolean => {
    if (filter === '') {
      return true // there is no filter set
    }

    const search = filter.toLowerCase()

    return (
      cred.email.toLowerCase().includes(search) ||
      cred.uri.toLowerCase().includes(search) ||
      cred.username.toLowerCase().includes(search)
    )
  }

  return (
    <>
      {creds?.length === 0 ? (
        <Grid justify="center" marginTop={0.5}>
          <Note label={false}>You haven&apos;t added any login credentials yet</Note>
        </Grid>
      ) : (
        <>
          {sortedCreds?.filter(filterByWebsiteOrTitleOrEmail).map((cred) => (
            <Credential key={cred.id} cred={cred} current={filter} />
          ))}
        </>
      )}
    </>
  )
}

export default Credentials
