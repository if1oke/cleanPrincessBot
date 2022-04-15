const pup = require('puppeteer')
const database = require('./database')
const princess = require('./princessCode')
const { Telegraf } = require('telegraf')
const moment = require('moment')

const statistic = {
  success: {
    total: 0,
    accounts: []
  },
  failed: {
    total: 0,
    accounts: []
  }
}

const replies = {
  error: {
    wrongChat: `Простите, но я работаю только в особом чате \u{1F92B}`,
    usedCode: 'Данный код ранее уже активировался',
    usedCodePart: 'Данный код был активирован ',
    wrongCode: 'Ошибка: код не найден',
    unknownID: 'ID не распознан, проверьте правильность ввода',
    existingID: 'Аккаунт с данным ID уже зарегистрирован',
    unknownError: 'Произошла ошибка, попробуйте позднее'
  },
  success: {
    freshCode: `Данный код раннее не вводился \u{1F609}`,
    registration: 'Аккаунт успешно зарегистрирован'
  },
  inProgress: {
    activation: 'Активация кода в процессе. Это может занять некоторое время.'
  },
  help: {
    commands: `<strong>Описание команд</strong>\n
/reg #ID - Регистрация учетной записи в системе (нужно указывать ID)
/code #CODE - Активация кода для зарегистрированных учетных записей
/uc - вывести список ранее активированных кодов:
   - /uc short - вывести краткий список
   - /uc #CODE - проверить вводился ли код ранее`
  }
}

const getBrowser = async headless => {
  if (!headless) {
    return await pup.launch({headless: false})
  } else {
    return await pup.launch({args: ['--no-sandbox']})
  }
}

const checkAccount = async id => {
  const browser = await getBrowser(true)
  const page = await browser.newPage()
  await page.goto('https://dut.igg.com/event/code?lang=rus')
  const result = await princess.accountCheck(page, id)
  if (!result) {
    await browser.close()
    return false
  } else {
    await browser.close()
    return true
  }
}

async function enterCode(code, logins, headless) {
  const codeStat = {
    code,
    details: {
      success: {
        total: 0,
        accounts: []
      },
      failed: {
        total: 0,
        accounts: []
      }
    }
  }
  const browser = await getBrowser(headless)
  const page = await browser.newPage()
  await page.goto('https://dut.igg.com/event/code?lang=rus')
  for (const item of logins) {
    const res = await princess.insertCode(page, item, code)
    if (res) {
      codeStat.details.success.total++
      codeStat.details.success.accounts.push(item)
    } else {
      codeStat.details.failed.total++
      codeStat.details.failed.accounts.push(item)
    }
  }
  await browser.close()
  return codeStat
}

const bot = new Telegraf('**********************', {
  handlerTimeout: 600_000
})

bot.command('reg', async ctx => {
  if (ctx.chat.id !== '************') {
    ctx.reply(replies.error.wrongChat)
    return false
  }
  let princessUserID = null
  try {
    princessUserID = ctx.update.message.text.match(/\d+/)[0]
  } catch (e) {
    ctx.reply(replies.error.unknownID)
    throw new Error(e)
  }
  const message = ctx.update.message

  // Проверка на сайте получения гифтов
  if (princessUserID) {
    const accountValidIdCheck = await checkAccount(princessUserID)
    if (accountValidIdCheck) {
      let response = await database.getAccount(princessUserID)
      if (Object.keys(response).length >= 1) {
        ctx.reply(replies.error.existingID)
      } else {
        response = await database.addAccount(princessUserID, message)
        if (response.name) {
          ctx.reply(`${replies.success.registration}: ${princessUserID}`)
        } else {
          ctx.reply(replies.error.unknownError)
        }
      }
    } else {
      ctx.reply(replies.error.unknownID)
    }
  } else {
    ctx.reply(replies.error.unknownID)
  }

})

bot.command('code', async ctx => {
  if (ctx.chat.id !== '************') {
    ctx.reply(replies.error.wrongChat)
    return false
  }
  const codeId = ctx.update.message.text.replace(/[/]code\s/, '')
  if (!codeId) {
    ctx.reply(replies.error.wrongCode)
  } else {
    const codeExistCheck = await database.getCode(codeId)
    if (Object.keys(codeExistCheck).length >= 1) {
      ctx.reply(replies.error.usedCode)
    } else {
      ctx.reply(replies.inProgress.activation)
      const accounts = await database.getAccounts()
      const accountsID = []
      Object.keys(accounts).map(item => {
        accountsID.push(accounts[item].accountId)
      })
      const result = await enterCode(codeId, accountsID, true)
      if (!result) {
        ctx.reply(`Активация другого кода в процессе, подождите...`)
      } else {
        await database.addCode(result)
        const total = result.details.success.total + result.details.failed.total
        ctx.reply(`Код ${codeId} активирован у ${result.details.success.total} из ${total} игроков`)
      }
    }
  }
})

bot.command('uc', async ctx => {
  if (ctx.chat.id !== '************') {
    ctx.reply(replies.error.wrongChat)
    return false
  }
  const data = await database.getCodes()
  let codesMessage = 'Список ранее активированных кодов:'

  const subCommand = ctx.update.message.text.replace(/[/]uc\s/, '')

  Object.keys(data).map(item => {
    moment.locale('ru')
    const parsedDate = moment(data[item].activateDate).format('LLL')
    codesMessage += `\n\u{1F4CB} ${data[item].code}  >  ${parsedDate}`
  })
  if (subCommand !== '/uc') {
    const resource = await database.getCode(subCommand)
    if (Object.keys(resource).length >= 1) {
      let message = replies.error.usedCodePart
      Object.keys(resource).map(item => {
        const parsedDate = moment(data[item].activateDate).format('LLL')
        message += `${parsedDate} \u{1F614}`
      })
      ctx.reply(message)
    } else {
      ctx.reply(replies.success.freshCode)
    }
  } else {
    ctx.reply(codesMessage)
  }
})

bot.command('help', async ctx => {
  if (ctx.chat.id !== '************') {
    ctx.reply(replies.error.wrongChat)
    return false
  }
  await ctx.replyWithHTML(replies.help.commands)
})

bot.launch()
