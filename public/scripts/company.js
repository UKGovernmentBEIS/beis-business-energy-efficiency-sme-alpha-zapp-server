var init = function (chartData) {

  const numberChartOptions = {
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0
      }
    },
    scales: {
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Weekdays in Zapp trial'
        }
      }],
      yAxes: [{
        ticks: {
          stepSize: 5
        }
      }]
    }
  }

  const percentageChartOptions = {
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0
      }
    },
    scales: {
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Weekdays in Zapp trial'
        }
      }],
      yAxes: [{
        ticks: {
          stepSize: 10,
          suggestedMax: 100
        }
      }]
    }
  }

  var ctx = document.getElementById('usersChart').getContext('2d');
  let usersChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Daily Total Users',
        data: chartData.dailyUserData.totalUsers,
        borderColor: '#EF103C',
        fill: false
      }, {
        label: 'Daily Active Users',
        data: chartData.dailyUserData.activeUsers,
        borderColor: '#3A2E39',
        fill: false
      }],
      labels: chartData.labels
    },
    options: numberChartOptions
  })

  var ctx = document.getElementById('installsChart').getContext('2d');
  let installsChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Zapp Installations',
        data: chartData.installationData.installations,
        borderColor: '#EF103C',
        fill: false
      }, {
        label: 'Zapp Uninstallations',
        data: chartData.installationData.uninstallations,
        borderColor: '#3A2E39',
        fill: false
      }],
      labels: chartData.labels
    },
    options: numberChartOptions
  })

  var ctx = document.getElementById('optedInChart').getContext('2d');
  let optedInChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: '% of Users Opted In to Hibernation',
        data: chartData.optedInData.optedInHibernationPercentages,
        borderColor: '#EF103C',
        fill: false
      }, {
        label: '% of Users Opted In to Heating',
        data: chartData.optedInData.optedInHeatingPercentages,
        borderColor: '#3A2E39',
        fill: false
      }],
      labels: chartData.labels
    },
    options: percentageChartOptions
  })

  var ctx = document.getElementById('hibernationChart').getContext('2d');
  let hibernationChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: '% of Zapp Driven Hibernations',
        data: chartData.hibernationData.hibernatedPercentages,
        borderColor: '#EF103C',
        fill: false
      }, {
        label: '% of Users Clicked "Not Tonight"',
        data: chartData.hibernationData.notTonightPercentages,
        borderColor: '#0367BF',
        fill: false
      }, {
        label: '% Other',
        data: chartData.hibernationData.otherPercentages,
        borderColor: '#3A2E39',
        fill: false
      }],
      labels: chartData.labels
    },
    options: percentageChartOptions
  })

  var ctx = document.getElementById('heatingNotificationChart').getContext('2d');
  let heatingNotificationChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: '% of Heating Actions Taken When Heating Notification Shown',
        data: chartData.heatingNotificationData.heatingNotificationData,
        borderColor: '#EF103C',
        fill: false
      }],
      labels: chartData.labels
    },
    options: percentageChartOptions
  })
}
