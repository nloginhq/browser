import { ChangeEvent, Dispatch, SetStateAction, useEffect, useCallback, useState } from 'react'
import { Checkbox, Grid, Input, Slider, Spacer, Text } from '@geist-ui/core'

import { cryptoSvc, GeneratePasswordOptions } from '../service/crypto'
import Copiable from './copiable'

const GeneratePassword = ({ setPassword }: { setPassword: Dispatch<SetStateAction<string>> }) => {
  const [charSets, setCharSets] = useState(['A-Z', 'a-z', '0-9', '!@#$%^&*'])
  const [upperAZDisabled, setUpperAZDisabled] = useState(false)
  const [lowerAZDisabled, setLowerAZDisabled] = useState(false)
  const [numsDisabled, setNumsDisabled] = useState(false)
  const [specialsDisabled, setSpecialsDisabled] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [passwordLength, setPasswordLength] = useState(14)
  const [minNumbers, setMinNumbers] = useState(1)
  const [minSpecial, setMinSpecial] = useState(1)
  const [generatedPasswordOptions, setGeneratedPasswordOptions] = useState(
    new GeneratePasswordOptions(passwordLength, true, true, true, true, minNumbers, minSpecial),
  )

  const generatePassword = useCallback(
    async (opts: GeneratePasswordOptions) => {
      let generated = cryptoSvc.generatePassword(opts)
      setGeneratedPassword(generated)
      setPassword(generated) // also update the value in the parent
    },
    [setPassword],
  )

  useEffect(() => {
    setUpperAZDisabled(false)
    setLowerAZDisabled(false)
    setNumsDisabled(false)
    setSpecialsDisabled(false)
    generatePassword(generatedPasswordOptions)
  }, [generatePassword, generatedPasswordOptions])

  const checkAndSetPasswordLengthInput = (e: ChangeEvent<HTMLInputElement>) => {
    let len = parseInt(e.target.value)
    let min = minNumbers + minSpecial
    if (len >= min && len <= 100) {
      setPasswordLength(len)

      let options = generatedPasswordOptions
      options.length = len
      setGeneratedPasswordOptions(options)
      generatePassword(options)
    }
  }

  const checkAndSetPasswordLengthSlider = (len: number) => {
    let min = minNumbers + minSpecial
    if (len >= min && len <= 100) {
      let options = generatedPasswordOptions
      options.length = len
      setGeneratedPasswordOptions(options)
      generatePassword(options)
      setPasswordLength(len)
    }
  }

  const updateCharSets = async (value: string[]) => {
    setUpperAZDisabled(false)
    setLowerAZDisabled(false)
    setNumsDisabled(false)
    setSpecialsDisabled(false)

    let options = generatedPasswordOptions
    options.azUpperSet = value.includes('A-Z')
    options.azLowerSet = value.includes('a-z')
    options.numsSet = value.includes('0-9')
    options.specialsSet = value.includes('!@#$%^&*')

    if (!(options.azLowerSet || options.numsSet || options.specialsSet)) {
      // only A-Z is selected, can't unselect it without adding another selection
      setUpperAZDisabled(true)
    }
    if (!(options.azUpperSet || options.numsSet || options.specialsSet)) {
      setLowerAZDisabled(true)
    }
    if (!(options.azUpperSet || options.azLowerSet || options.specialsSet)) {
      setNumsDisabled(true)
    }
    if (!(options.azUpperSet || options.numsSet || options.azLowerSet)) {
      setSpecialsDisabled(true)
    }

    if (!options.numsSet) {
      setMinNumbers(0)
      options.minNums = 0
    }
    if (!options.specialsSet) {
      setMinSpecial(0)
      options.minSpecial = 0
    }

    setGeneratedPasswordOptions(options)
    generatePassword(options)
  }

  const updateMinNumbers = (e: ChangeEvent<HTMLInputElement>) => {
    let minNums = parseInt(e.target.value)
    if (e.target.value == '' || minNums < 0) {
      minNums = 0
    }

    if (!numsDisabled && minNums + minSpecial <= passwordLength) {
      setMinNumbers(minNums)

      let options = generatedPasswordOptions
      options.minNums = minNums
      setGeneratedPasswordOptions(options)
      generatePassword(options)
    }
  }

  const updateMinSpecials = (e: ChangeEvent<HTMLInputElement>) => {
    let minSpecials = parseInt(e.target.value)
    if (e.target.value == '' || minSpecials < 0) {
      minSpecials = 0
    }

    if (!specialsDisabled && minNumbers + minSpecials <= passwordLength) {
      setMinSpecial(minSpecials)

      let options = generatedPasswordOptions
      options.minSpecial = minSpecials
      setGeneratedPasswordOptions(options)
      generatePassword(options)
    }
  }

  return (
    <>
      <Grid.Container width="100%">
        <Grid sm={24} xs={24}>
          <Text blockquote margin={0} className="generated-password" width="100%">
            <Grid.Container gap={1} justify="center">
              <Grid className="max-lines" width="90%">
                {generatedPassword}
              </Grid>
              <Grid width="5%">
                <Copiable val={generatedPassword} />
              </Grid>
            </Grid.Container>
          </Text>
        </Grid>
      </Grid.Container>
      <Text small>length</Text>
      <Grid.Container gap={1}>
        <Grid xs={5}>
          <Input
            value={passwordLength.toString()}
            htmlType="number"
            min={minNumbers + minSpecial}
            onChange={checkAndSetPasswordLengthInput}
          />
        </Grid>
        <Grid xs={17} marginLeft={1} marginTop={1}>
          <Slider
            value={passwordLength}
            min={1}
            max={100}
            onChange={checkAndSetPasswordLengthSlider}
            width="100%"
          />
        </Grid>
      </Grid.Container>
      <Spacer h={0.5} />
      <Grid.Container gap={1} marginLeft={1} sm={24} xs={18} justify="center">
        <Checkbox.Group value={charSets} onChange={updateCharSets}>
          <Checkbox disabled={upperAZDisabled} value="A-Z">
            A-Z
          </Checkbox>
          <Checkbox disabled={lowerAZDisabled} value="a-z">
            a-z
          </Checkbox>
          <Checkbox disabled={numsDisabled} value="0-9">
            0-9
          </Checkbox>
          <Checkbox disabled={specialsDisabled} value="!@#$%^&*">
            !@#$%^&*
          </Checkbox>
        </Checkbox.Group>
      </Grid.Container>
      <Spacer h={0.5} />
      <Grid.Container gap={1} justify="center">
        <Grid xs={12}>
          <Input
            label="min. nums"
            value={minNumbers.toString()}
            htmlType="number"
            onChange={updateMinNumbers}
          />
        </Grid>
        <Grid xs={12}>
          <Input
            label="min. special"
            value={minSpecial.toString()}
            htmlType="number"
            onChange={updateMinSpecials}
          />
        </Grid>
      </Grid.Container>
    </>
  )
}

export default GeneratePassword
