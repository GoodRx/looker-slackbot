import * as _ from "underscore"
import config from "../config"
import { Looker } from "../looker"
import { DashboardQueryRunner } from "../repliers/dashboard_query_runner"
import { ReplyContext } from "../reply_context"
import { Command } from "./command"

export class CustomCommand extends Command {

  public attempt(context: ReplyContext) {
    const normalizedText = context.sourceMessage.text.toLowerCase()
    const shortCommands = _.sortBy(_.values(Looker.customCommands), (c) => -c.name.length)
    const matchedCommand = shortCommands.filter((c) => normalizedText.indexOf(c.name) === 0)[0]
    if (matchedCommand) {

      const { dashboard } = matchedCommand
      const query = context.sourceMessage.text.slice(matchedCommand.name.length).trim()
      normalizedText.indexOf(matchedCommand.name)

      context.looker = matchedCommand.looker

      const filters: {[key: string]: string} = {}
      const dashboardFilters = dashboard.dashboard_filters || dashboard.filters

      // Parse query into multiple filter parts, optionally quoted
      var queryParts = []
      if (dashboardFilters.length === 1) {
        // Special convenience case for single-filter dashboards
        queryParts.push(query)
      } else {
        const splitRegex  = /[^\s"]+|"([^"]*)"/g
        do {
            var match = splitRegex.exec(query)
            if (match != null)
            {
                queryParts.push(match[1] ? match[1] : match[0])
            }
        } while (match != null)
      }

      const commonLength = Math.min(dashboardFilters.length, queryParts.length)
      for (var i = 0; i < commonLength; i++) {
        const filter = dashboardFilters[i]
        const queryPart = queryParts[i]
        filters[filter.name] = queryPart
      }

      const runner = new DashboardQueryRunner(context, matchedCommand.dashboard, filters)
      runner.start()

      return true
    } else {
      return false
    }
  }

}
