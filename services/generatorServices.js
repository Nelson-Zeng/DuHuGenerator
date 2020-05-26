const fs = require("fs")
const compressing = require("compressing")
const path = require("path")

const utils = require("../lib/utils")
const consts = require("../lib/constants")

const ENCODING_LATIN1 = "latin1"
const ENCODING_UTF8 = "utf8"

function dataGenerator(body) {
  return new Promise((resolve, reject) => {
    // 生成唯一ID
    const requestId = utils.generateNonceCode()

    const requestDir = path.join(
      __dirname,
      `../tempData/generation_request_${requestId}`
    )
    const sampleDir = path.join(__dirname, "../sample")

    // 创建临时文件夹
    fs.mkdirSync(requestDir)

    let tagIndex = 5
    let eventIndex = 999
    let countryFile = ""
    const countryTags = []
    const countries = []
    const decisionTexts = []
    const scriptTriggers = []
    const chineseMissionTriggers = []
    const returnModifiers = []
    const returnDuhuModifierTitles = []
    const duhuBuildingModifierTitles = []
    const duhuBuildingModifierDescs = []
    const countryFileSample = fs.readFileSync(
      path.join(sampleDir, "./AN2.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    const declareWarSample = fs.readFileSync(
      path.join(sampleDir, "./declareWarTemplate.txt"),
      { encoding: ENCODING_UTF8 }
    )
    const returnDuhuSample = fs.readFileSync(
      path.join(sampleDir, "./returnDuhuTemplateWithoutDecline.txt"),
      { encoding: ENCODING_UTF8 }
    )
    const buildDuhuSample = fs.readFileSync(
      path.join(sampleDir, "./buildDuhuTemplate.txt"),
      { encoding: ENCODING_UTF8 }
    )
    const countryHistorySample = fs.readFileSync(
      path.join(sampleDir, "./AN2 - AN2.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    const returnEventSample = fs.readFileSync(
      path.join(sampleDir, "./returnEventSample.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    const decisionSample = fs.readFileSync(
      path.join(sampleDir, "./decisionSample.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    const decisionCoditionSample = fs.readFileSync(
      path.join(sampleDir, "./decisionConditionSample.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    const decisionTerritorySample = fs.readFileSync(
      path.join(sampleDir, "./decisionTerritorySample.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    const decisionDiscoverySample = fs.readFileSync(
      path.join(sampleDir, "./decisionDiscoverySample.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    const baseDiscoverySample = fs.readFileSync(
      path.join(sampleDir, "./baseDiscoverySample.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    const declareWarActions = []
    const returnDuhuActions = []
    const buildDuhuModifiers = []
    const countryHistories = []
    const returnEvents = []
    const eventsLocalisation = []
    const decisions = []
    body.map((duhu) => {
      const decisionId = `ancient_chinese_${duhu.id}_build`
      const name = duhu.name
      // 生成国家tag
      const tag = `AN${tagIndex}`
      countryTags.push(`${tag} = "countries/${tag}.txt"        # ${name}`)
      // 生成国家文件
      // 获取国家文件模板
      // 替换国家颜色
      countryFile = countryFileSample
      countryFile = countryFile.replace(/color = { ([\s\d]*) }/g, ($1, $2) => {
        return $1.replace($2, utils.exchangeHexToRgb(duhu.color))
      })
      countries.push({
        title: `${tag}.txt`,
        value: countryFile,
      })

      // 生成国家历史文件
      countryHistories.push({
        title: `${tag} - ${tag}.txt`,
        value: countryHistorySample.replace(/capital = (\d*)/, ($1, $2) => {
          return $1.replace($2, duhu.capital)
        }),
      })

      // 生成国家任务trigger
      scriptTriggers.push(
        `                AND = { owned_by = ${tag} ${tag} = { is_subject_of = ROOT } }`
      )

      // 生成古代中国任务trigger
      chineseMissionTriggers.push(
        `                    AND = { owned_by = ${tag} ${tag} = { is_subject_of = ROOT } }`
      )

      // 生成回收和建立都护府的标记
      returnModifiers.push(`md_return_duhufu_${tag} = {\r\n}`)
      buildDuhuModifiers.push(buildDuhuSample.replace("duhufu", duhu.id))

      // 生成都护府宣战指令
      declareWarActions.push(declareWarSample.replace(/AN2/g, tag))

      // 生成收回都护府指令
      returnDuhuActions.push(
        returnDuhuSample
          .replace(/an2/g, tag)
          .replace(/AN2/g, tag)
          .replace(/md_building_anduhufu/g, `md_building_${duhu.id}`)
          .replace("rab_events.100", `rab_events.${eventIndex}`)
      )

      // 生成回收都护府事件
      returnEvents.push(
        returnEventSample
          .replace(":rabEventsId", `rab_events.${eventIndex}`)
          .replace(":rabEventsName", `rab_events.NAME${eventIndex}`)
          .replace(":rabEventsDesc", `rab_events.DESC${eventIndex}`)
          .replace(":rabEventsOption", `rab_events.OPTA${eventIndex}`)
          .replace(":tag", tag)
          .replace(":modifierName", `md_return_duhufu_${tag}`)
      )

      // 生成决议内容
      const decisionConditions = []
      const decisionTerritories = []
      const decisionDiscoveries = []
      duhu.conditions.map((condition) => {
        decisionConditions.push(
          decisionCoditionSample.replace(":area", `${condition}_area`)
        )
      })
      duhu.territories.map((territory) => {
        let territoryOptions = {
          type: "region",
          value: "",
        }
        switch (typeof territory) {
          case "string":
            territoryOptions.value = `${territory}_region`
            break
          case "object":
            territoryOptions = {
              type: territory.type,
              value: `${territory.value}_${territory.type}`,
            }
            break
        }
        decisionTerritories.push(
          decisionTerritorySample
            .replace(":type", territoryOptions.type)
            .replace(":territory", territoryOptions.value)
        )
      })
      duhu.discoveries.map((discovery) => {
        decisionDiscoveries.push(
          decisionDiscoverySample
            .replace(":discovery", `${discovery}_region`)
            .replace(":tag", tag)
        )
      })
      const decisionConditionText = decisionConditions.join("\r\n")
      const decisionTerritoryText = decisionTerritories.join("\r\n")
      const decisionDiscoveryText =
        decisionDiscoveries.join("\r\n") +
        "\r\n" +
        baseDiscoverySample.replace(/:tag/g, tag)
      let decision = decisionSample
      decisions.push(
        decision
          .replace(/:tag/g, tag)
          .replace(/:name/g, name)
          .replace(/:id/g, decisionId)
          .replace(/:buidingModifier/g, `md_building_${duhu.id}`)
          .replace(/:returnModifier/g, `md_return_duhufu_${tag}`)
          .replace(":conditions", decisionConditionText)
          .replace(":territories", decisionTerritoryText)
          .replace(":discoveries", decisionDiscoveryText)
      )

      // 生成相关文字内容
      decisionTexts.push(` ${decisionId}_title:0 "成立${name}"`)
      decisionTexts.push(
        ` ${decisionId}_desc:0 "${consts.DECISION_DESC.replace(":name", name)}"`
      )
      duhuBuildingModifierTitles.push(
        ` md_building_${duhu.id}: 0 "${name}的成立"`
      )
      duhuBuildingModifierDescs.push(
        ` desc_md_building_${
          duhu.id
        }:0 "${consts.BUILDING_MODIFIER_DESC.replace(":name", name)}"`
      )
      returnDuhuModifierTitles.push(
        ` md_return_duhufu_${tag}:0 "${name}的回归"`
      )
      eventsLocalisation.push(
        ` rab_events.NAME${eventIndex}:0 "${name}顺利回归"`
      )
      eventsLocalisation.push(
        ` rab_events.DESC${eventIndex}:0 "${consts.RETURN_DUHU_DESC}"`
      )
      eventsLocalisation.push(` rab_events.OPTA${eventIndex}:0 "太好了"`)

      tagIndex++
      eventIndex--
    })

    // 整合国家tag
    const countryTagsText = countryTags.join("\r\n")
    // 整合国家任务trigger
    const scriptTriggerText = scriptTriggers.join("\r\n")
    // 整合古代中国任务trigger
    const chineseMissionTriggerText = chineseMissionTriggers.join("\r\n")
    // 整合回收都护府的标记
    const returnModifierText = returnModifiers.join("\r\n")
    const returnModifierTitleText = returnDuhuModifierTitles.join("\r\n")
    // 整合都护府宣战指令
    const declareWarText = declareWarActions.join("\r\n")
    // 整合回收都护府指令
    const returnDuhuText = returnDuhuActions.join("\r\n")
    // 整合决议内容
    const decisionText = decisions.join("\r\n\r\n")
    // 整合决议文本
    const decisionLocalisazion = decisionTexts.join("\r\n")
    // 整合回收都护府事件
    const returnDuhuEventsText = returnEvents.join("\r\n\r\n")
    // 整合建立都护府标记
    const duhuBuildingModifiers = buildDuhuModifiers.join("\r\n")
    const duhuBuildingModifiersTitleDescs = duhuBuildingModifierTitles.join(
      "\r\n"
    )
    const duhuBuildingModifierDescText = duhuBuildingModifierDescs.join("\r\n")
    // 整合回收都护府事件本地化内容
    const returnDuhuLocalisationText = eventsLocalisation.join("\r\n")

    // 生成各种次级文件夹
    fs.mkdirSync(path.join(requestDir, "./common"))
    fs.mkdirSync(path.join(requestDir, "./localisation"))
    fs.mkdirSync(path.join(requestDir, "./missions"))
    fs.mkdirSync(path.join(requestDir, "./history"))
    fs.mkdirSync(path.join(requestDir, "./events"))
    fs.mkdirSync(path.join(requestDir, "./decisions"))
    const countryPath = path.join(requestDir, "./common/countries")
    fs.mkdirSync(countryPath)
    const countryTagsPath = path.join(requestDir, "./common/country_tags")
    fs.mkdirSync(countryTagsPath)
    const modifierPath = path.join(requestDir, "./common/event_modifiers")
    fs.mkdirSync(modifierPath)
    const triggerPath = path.join(requestDir, "./common/scripted_triggers")
    fs.mkdirSync(triggerPath)
    const declareWarPath = path.join(
      requestDir,
      "./common/new_diplomatic_actions"
    )
    fs.mkdirSync(declareWarPath)
    const historyPath = path.join(requestDir, "./history/countries")
    fs.mkdirSync(historyPath)

    // 写入文件
    // 写入国家tag
    const countryTagsFile = fs.readFileSync(
      path.join(sampleDir, "./rab_countries.txt"),
      { encoding: ENCODING_UTF8 }
    )
    fs.writeFileSync(
      path.join(countryTagsPath, "./rab_countries.txt"),
      countryTagsFile + countryTagsText,
      { encoding: ENCODING_UTF8 }
    )

    // 写入国家文件
    countries.map((country) => {
      fs.writeFileSync(
        path.join(countryPath, `./${country.title}`),
        country.value,
        { encoding: ENCODING_LATIN1 }
      )
    })

    // 写入国家历史文件
    countryHistories.map((history) => {
      fs.writeFileSync(
        path.join(historyPath, `./${history.title}`),
        history.value,
        { encoding: ENCODING_LATIN1 }
      )
    })

    // 写入国家任务trigger
    const triggerSample = fs.readFileSync(
      path.join(sampleDir, "./rab_scripted_triggers.txt"),
      {
        encoding: ENCODING_UTF8,
      }
    )
    fs.writeFileSync(
      path.join(triggerPath, "./rab_scripted_triggers.txt"),
      triggerSample.replace(
        /AND = { owned_by = AN2 AN2 = { is_subject_of = ROOT } }/g,
        ($1) => {
          return $1 + "\r\n" + scriptTriggerText
        }
      ),
      { encoding: ENCODING_UTF8 }
    )

    // 写入古代中国任务trigger
    const chineseMissionSample = fs.readFileSync(
      path.join(sampleDir, "./Chinese_Missions.txt"),
      {
        encoding: ENCODING_UTF8,
      }
    )
    fs.writeFileSync(
      path.join(requestDir, "./missions/Chinese_Missions.txt"),
      chineseMissionSample.replace(
        /AND = { owned_by = AN2 AN2 = { is_subject_of = ROOT } }/g,
        ($1) => {
          return $1 + "\r\n" + chineseMissionTriggerText
        }
      ),
      { encoding: ENCODING_UTF8 }
    )

    // 写入都护府回归标记
    const modifierSample = fs.readFileSync(
      path.join(sampleDir, "./rab_event_modifiers.txt"),
      { encoding: ENCODING_UTF8 }
    )
    fs.writeFileSync(
      path.join(modifierPath, "./rab_event_modifiers.text"),
      modifierSample +
        "\r\n" +
        returnModifierText +
        "\r\n" +
        duhuBuildingModifiers,
      { encoding: ENCODING_UTF8 }
    )

    // 写入都护府宣战和收回事件
    const declareWarFileSample = fs.readFileSync(
      path.join(sampleDir, "./rab_declare_war_actions.txt"),
      { encoding: ENCODING_UTF8 }
    )
    fs.writeFileSync(
      path.join(declareWarPath, "./rab_declare_war_actions.txt"),
      declareWarFileSample + "\r\n" + declareWarText + "\r\n" + returnDuhuText,
      { encoding: ENCODING_UTF8 }
    )

    // 写入回收都护府事件内容
    const returnFileSample = fs.readFileSync(
      path.join(sampleDir, "./TS_rab_events_1.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    fs.writeFileSync(
      path.join(requestDir, "./events/TS_rab_events_1.txt"),
      returnFileSample + "\r\n\r\n" + returnDuhuEventsText,
      { encoding: ENCODING_LATIN1 }
    )

    // 写入成立都护府的决议
    const buildDecisionSample = fs.readFileSync(
      path.join(sampleDir, "./TS_rab_country_decision.txt"),
      { encoding: ENCODING_LATIN1 }
    )
    fs.writeFileSync(
      path.join(requestDir, "./decisions/TS_rab_country_decision.txt"),
      buildDecisionSample + "\r\n\r\n" + decisionText,
      { encoding: ENCODING_LATIN1 }
    )

    // 写入本地化
    const decisionLocalisazionSample = utils.decodeChinese(
      fs.readFileSync(path.join(sampleDir, "./rab_text_l_english.yml"), {
        encoding: ENCODING_UTF8,
      })
    )
    fs.writeFileSync(
      path.join(requestDir, "./localisation/rab_text_l_english.yml"),
      utils.encodeChinese(
        decisionLocalisazionSample +
          "\r\n" +
          decisionLocalisazion +
          "\r\n" +
          duhuBuildingModifiersTitleDescs +
          "\r\n" +
          duhuBuildingModifierDescText +
          "\r\n" +
          returnModifierTitleText
      ),
      { encoding: null }
    )

    // 写入事件本地化
    const eventsLocalisazionSample = utils.decodeChinese(
      fs.readFileSync(path.join(sampleDir, "./rab_event_l_english.yml"), {
        encoding: ENCODING_UTF8,
      })
    )
    fs.writeFileSync(
      path.join(requestDir, "./localisation/rab_event_l_english.yml"),
      utils.encodeChinese(
        eventsLocalisazionSample + "\r\n" + returnDuhuLocalisationText
      ),
      { encoding: null }
    )

    // 打包全部文件
    const zipFilePath = path.join(requestDir, `../${requestId}.zip`)
    compressing.zip.compressDir(requestDir, zipFilePath).then(() => {
      utils.recursivelyRemove(fs, requestDir)
      resolve(zipFilePath)
    })
  })
}

module.exports = {
  dataGenerator,
}
