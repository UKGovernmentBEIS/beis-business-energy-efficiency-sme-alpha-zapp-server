window.initCharts = function (chartData) {
  const Chart = window.Chart

  const weekdaysXAxes = [{ scaleLabel: { display: true, labelString: 'Weekdays in Zapp trial' } }]
  const commonChartOptions = Object.freeze({
    maintainAspectRatio: false,
    elements: { line: { tension: 0 } }
  })

  const numberChartOptions = Object.assign({
    scales: {
      xAxes: weekdaysXAxes,
      yAxes: [{ ticks: { stepSize: 5 } }]
    }
  }, commonChartOptions)

  const percentageChartOptions = Object.assign({
    scales: {
      xAxes: weekdaysXAxes,
      yAxes: [{ ticks: { stepSize: 10, suggestedMin: 0, suggestedMax: 100 } }]
    }
  }, commonChartOptions)

  const lineColors = ['#EF103C', '#3A2E39', '#0367BF']

  function chart (canvasId, options, datasets) {
    const ctx = document.getElementById(canvasId).getContext('2d')
    const datasetsWithStyle = datasets.map((dataset, i) => {
      const styleOptions = { fill: false, borderColor: lineColors[i] }
      return Object.assign(styleOptions, dataset)
    })
    const data = { datasets: datasetsWithStyle, labels: chartData.labels }
    return new Chart(ctx, { type: 'line', options, data })
  }

  chart('usersChart', numberChartOptions, [
    {
      label: 'Daily Total Users',
      data: chartData.dailyUserData.totalUsers
    },
    {
      label: 'Daily Active Users',
      data: chartData.dailyUserData.activeUsers
    }
  ])

  chart('installsChart', numberChartOptions, [
    {
      label: 'Zapp Installations',
      data: chartData.installationData.installations
    },
    {
      label: 'Zapp Uninstallations',
      data: chartData.installationData.uninstallations
    }
  ])

  chart('optedInChart', percentageChartOptions, [
    {
      label: '% of Users Opted In to Hibernation',
      data: chartData.optedInData.optedInHibernationPercentages
    }, {
      label: '% of Users Opted In to Heating',
      data: chartData.optedInData.optedInHeatingPercentages
    }
  ])

  chart('hibernationChart', percentageChartOptions, [
    {
      label: '% of Zapp Driven Hibernations',
      data: chartData.hibernationData.hibernatedPercentages
    },
    {
      label: '% of Users Clicked "Not Tonight"',
      data: chartData.hibernationData.notTonightPercentages
    },
    {
      label: '% Other',
      data: chartData.hibernationData.otherPercentages
    }
  ])

  chart('heatingNotificationChart', percentageChartOptions, [
    {
      label: '% of Heating Actions Taken When Heating Notification Shown',
      data: chartData.heatingNotificationData.heatingNotificationData
    }
  ])
}
