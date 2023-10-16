import { useState } from 'react'
import { Copy, Check } from '@geist-ui/icons'

const Copiable = ({ val }: { val: string }) => {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(val)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <>
      {copied ? (
        <Check className="copiable" color="grey" />
      ) : (
        <Copy className="copiable" color="grey" onClick={copy} />
      )}
    </>
  )
}

export default Copiable
