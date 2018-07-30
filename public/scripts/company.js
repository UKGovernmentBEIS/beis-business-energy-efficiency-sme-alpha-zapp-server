var init = function (dashboardData) {

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
        data: dashboardData.dailyUserData.totalUsers,
        borderColor: '#EF103C',
        fill: false
      }, {
        label: 'Daily Active Users',
        data: dashboardData.dailyUserData.activeUsers,
        borderColor: '#3A2E39',
        fill: false
      }],
      labels: dashboardData.labels
    },
    options: numberChartOptions
  })

  var ctx = document.getElementById('installsChart').getContext('2d');
  let installsChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Zapp Installations',
        data: dashboardData.installationData.installations,
        borderColor: '#EF103C',
        fill: false
      }, {
        label: 'Zapp Uninstallations',
        data: dashboardData.installationData.uninstallations,
        borderColor: '#3A2E39',
        fill: false
      }],
      labels: dashboardData.labels
    },
    options: numberChartOptions
  })

  var ctx = document.getElementById('optedInChart').getContext('2d');
  let optedInChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: '% of Users Opted In to Hibernation',
        data: dashboardData.optedInData.optedInHibernationPercentages,
        borderColor: '#EF103C',
        fill: false
      }, {
        label: '% of Users Opted In to Heating',
        data: dashboardData.optedInData.optedInHeatingPercentages,
        borderColor: '#3A2E39',
        fill: false
      }],
      labels: dashboardData.labels
    },
    options: percentageChartOptions
  })

  var ctx = document.getElementById('hibernationChart').getContext('2d');
  let hibernationChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: '% of Zapp Driven Hibernations',
        data: dashboardData.hibernationData.hibernatedPercentages,
        borderColor: '#EF103C',
        fill: false
      }, {
        label: '% of Users Clicked "Not Tonight"',
        data: dashboardData.hibernationData.notTonightPercentages,
        borderColor: '#0367BF',
        fill: false
      }, {
        label: '% Other',
        data: dashboardData.hibernationData.otherPercentages,
        borderColor: '#3A2E39',
        fill: false
      }],
      labels: dashboardData.labels
    },
    options: percentageChartOptions
  })

  var ctx = document.getElementById('heatingNotificationChart').getContext('2d');
  let heatingNotificationChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: '% of Heating Actions Taken When Heating Notification Shown',
        data: dashboardData.heatingNotificationData.heatingNotificationData,
        borderColor: '#EF103C',
        fill: false
      }],
      labels: dashboardData.labels
    },
    options: percentageChartOptions
  })
}
