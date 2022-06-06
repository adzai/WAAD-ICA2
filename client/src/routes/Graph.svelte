<script>
    import Chart from "chart.js/auto/auto.esm";
    export let stats; // Stats passed in from ViewQuestion component
    // Renders chart.js with relevant data gathered from exported stats from above
    function renderChart() {
        document.getElementById("showResults").remove();
        var ctx = document.getElementById("myChart").getContext("2d");
        let labels = [];
        let data = [];
        for (let k of Object.keys(stats)) {
            labels.push(stats[k].name);
            data.push(stats[k].counter);
        }
        const chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Results",
                        backgroundColor: [
                            "rgba(75, 192, 192, 0.2)",
                            "rgba(255, 205, 86, 0.2)",
                            "rgba(201, 203, 207, 0.7)",
                            "rgba(54, 162, 235, 0.2)",
                            "rgba(255, 99, 132, 0.2)",
                            "rgba(153, 102, 255, 0.2)",
                        ],
                        borderColor: [
                            "rgb(75, 192, 192)",
                            "rgb(255, 205, 86)",
                            "rgb(201, 203, 207)",
                            "rgb(54, 162, 235)",
                            "rgb(255, 99, 132)",
                            "rgb(153, 102, 255)",
                        ],
                        borderWidth: 1,
                        data: data,
                    },
                ],
            },
            options: {
                responsive: true,
            },
        });
    }
</script>

<button id="showResults" class="resultButton" on:click={renderChart}
    >Show results</button
>
<canvas id="myChart" />

<style>
    .resultButton {
        appearance: none;
        background-color: transparent;
        border: 2px solid #1a1a1a;
        border-radius: 15px;
        box-sizing: border-box;
        color: #3b3b3b;
        cursor: pointer;
        display: inline-block;
        font-size: 16px;
        font-weight: 600;
        line-height: normal;
        margin: 0;
        min-height: 60px;
        min-width: 0;
        outline: none;
        padding: 16px 24px;
        text-align: center;
        text-decoration: none;
        transition: all 300ms cubic-bezier(0.23, 1, 0.32, 1);
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        width: 95%;
        will-change: transform;
    }

    .resultButton:hover {
        color: #fff;
        background-color: #1a1a1a;
        box-shadow: rgba(0, 0, 0, 0.25) 0 8px 15px;
        transform: translateY(-2px);
    }

    .resultButton:active {
        box-shadow: none;
        transform: translateY(0);
    }
</style>
