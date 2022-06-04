<script>
    import { onMount } from "svelte";
    export let params;
    const getID = async () => {
        console.log(params.id);
    };
    /* onMount(getID()); */

    const fetchQuestion = (async () => {
    const response = await fetch(`http://localhost:3000/questions/${params.id}`)
    return await response.json()
	})()
</script>

<h1>HI</h1>
{#await fetchQuestion}
    <p>...waiting</p>
{:then data}
    <ul>
        {#each data[Object.keys(data)[0]] as answerName}
          <li>
          {answerName}
          </li>
        {/each}
      </ul>
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}
