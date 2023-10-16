import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Grid, Image, Input, Note, Spinner } from '@geist-ui/core'
import { Search } from '@geist-ui/icons'

import { ErrNoVaultAuth, client, UnencryptedCredential } from '../../../service/client'
import Credentials from './credentials'
import Add from './add'
import { useNavigate } from 'react-router-dom'

export default function Vault() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const { data, error } = useSWR<UnencryptedCredential[], Error>(
    '/credentials',
    client.getDecryptedCredentials,
  )

  useEffect(() => {
    client.load().catch((err: any) => {
      if (err === ErrNoVaultAuth) {
        navigate('/')
      } else {
        // TODO: display this
        console.log(err)
      }
    })
    // this will automatically set the filter to the current tab if there is a credential for it
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      let filter = tabs[0].url || ''
      if (filter !== '') {
        var url = new URL(filter)
        var hostnameParts = url.hostname.split('.')
        var mainPart =
          hostnameParts.length > 2 ? hostnameParts[hostnameParts.length - 2] : url.hostname
        setFilter(mainPart)
      }
    })
  }, [])

  return (
    <Grid.Container justify="center" width={'100%'}>
      {data === undefined ? (
        <Grid xs={24} justify="center">
          <Spinner />
        </Grid>
      ) : (
        <>
          <Grid xs={24} justify="center">
            <Image src="/img/icon48.png" alt="nlogin lock" draggable={false} mx={0} />
          </Grid>
          {error !== undefined && (
            <Grid xs={24} justify="center" marginBottom={0.5}>
              <Note type="error" label="error" width="100%" filled>
                {error.message}
              </Note>
            </Grid>
          )}
          <Grid xs={24} justify="center" width={'100%'}>
            <Input
              clearable
              placeholder="search"
              width="100%"
              icon={<Search />}
              onChange={(e) => {
                setFilter(e.target.value)
              }}
              value={filter}
            />
          </Grid>
          <Grid xs={24} justify="center" width={'100%'}>
            <Add filter={filter} />
          </Grid>
          <Credentials creds={data} filter={filter} />
        </>
      )}
    </Grid.Container>
  )
}
