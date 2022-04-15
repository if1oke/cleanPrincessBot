module.exports.accountCheck = async (page, id) => {
  const login = await page.$('#iggid')
  const code = await page.$('#cdkey')
  const submit = await page.$('#submit')

  await login.type(id)
  await code.type('000')
  await submit.click()

  await timeout(1000)

  const result = await page.$('#extra_msg')
  const answer = await result.evaluate(el => el.textContent, result)

  if (answer === answerTypes.wrongId.text) {
    return false
  } else {
    return true
  }
}

module.exports.insertCode = async (page, login_id, code_id) => {
  let status = null

  const login = await page.$('#iggid')
  const code = await page.$('#cdkey')
  const submit = await page.$('#submit')
  const close = await page.$('#pop_extra_info_close')

  await login.type(login_id)
  await code.type(code_id)
  await submit.click()

  await timeout(500)

  const result = await page.$('#extra_msg')
  const answer = await result.evaluate(el => el.textContent, result)
  if (answer === answerTypes.wrongId.text) {
    status = false
  } else if (answer === answerTypes.wrongCode.text) {
    status = false
  } else if (answer === answerTypes.success.text) {
    status = true
  } else {
    status = false
  }

  await close.click()

  await page.evaluate(el => el.value = '', login)
  await page.evaluate(el => el.value = '', code)

  return status
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const answerTypes = {
  wrongId: {
    text: 'Неверный IGG ID, или игра на тех. обслуживании.'
  },
  wrongCode: {
    text: 'Такого кода не существует!'
  },
  success: {
    text: 'Сокровище выкуплено'
  }
}
