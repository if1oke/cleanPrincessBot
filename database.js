const axios = require('axios')
const url_accounts = 'https://*************Accounts.json'
const url_codes = 'https://************/Codes.json'
const token = '****************************'


module.exports.getAccounts = async () => {
  const response = await axios.get(url_accounts, {
    headers: {
      'Authorization': token
    }
  })
  return response.data
}

module.exports.getAccount = async (id) => {
  const response = await axios.get(url_accounts + `?**********************"`)
  return response.data
}

module.exports.addAccount = async (accountId, message) => {
  const userData = {
    telegramUID: message.from.id,
    username: message.from.username,
    firstName: message.from.first_name ? message.from.first_name : null,
    lastName: message.from.last_name ? message.from.last_name : null,
    createDate: new Date().toISOString()
  }
  const response = await axios.post(url_accounts, {
    accountId,
    userData
  })
  return response.data
}

module.exports.getCodes = async () => {
  const response = await axios.get(url_codes)
  return response.data
}

module.exports.getCode = async id => {
  const response = await axios.get(url_codes + `?*********************"`)
  return response.data
}

module.exports.addCode = async code => {
  const response = await axios.post(url_codes, {
    activateDate: new Date().toISOString(),
    ...code
  })
  return response.data
}