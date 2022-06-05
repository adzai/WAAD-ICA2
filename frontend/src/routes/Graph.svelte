<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto/auto.esm';
  export let stats;
  function renderChart() {
    var ctx = document.getElementById("myChart").getContext("2d");
    let labels = [];
    let data = [];
    for (let k of Object.keys(stats)) {
        labels.push(stats[k].name);
        data.push(stats[k].counter);
    }
    var chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Results",
            backgroundColor: [
      'rgba(75, 192, 192, 0.2)',
      'rgba(255, 205, 86, 0.2)',
      'rgba(201, 203, 207, 0.7)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(255, 99, 132, 0.2)',
      'rgba(153, 102, 255, 0.2)'],
            borderColor: [
                  'rgb(75, 192, 192)',
                  'rgb(255, 205, 86)',
                  'rgb(201, 203, 207)',
                  'rgb(54, 162, 235)',
                  'rgb(255, 99, 132)',
                  'rgb(153, 102, 255)'],
                  borderWidth: 1,
            data: data
          }
        ]
      },
      options: {}
    });
  }
</script>
<button on:click={renderChart}>Show results</button>
<canvas id="myChart"></canvas>
