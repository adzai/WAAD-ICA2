<script>
    export let questionId;
    /* onMount(getID()); */

    const fetchQuestion = (async () => {
    const response = await fetch(`http://localhost:3000/questions/${questionId}`)
    return await response.json()
	})()

    function vote(answerId) {
        fetch(`http://localhost:3000/answers/${answerId}`,
{
        credentials: "same-origin",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: "POST",
})
    .then(function(res){ console.log(res) })
    .catch(function(res){ console.log(res) })
    }
</script>

<h1>HI</h1>
{#await fetchQuestion}
    <p>...waiting</p>
{:then data}
    <ul>
        {#each data[Object.keys(data)[0]] as answer}
          <li>
          <button on:click={() => vote (answer.id)}>{answer.name}</button>
          {#if answer.voted}
          <span>Voted</span>
          {/if}
          </li>
        {/each}
      </ul>
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}
