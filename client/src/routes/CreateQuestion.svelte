<script>
    let errors = {}

    function validateForm(data) {
    }
    let answerCount = 2;
    function updateAnswerCount() {
        if (answerCount < 6) {
            answerCount += 1;
        }
    }
    function handleSubmit(e) {
        const formData = new FormData(e.target);
        let question = false;
        let answers = [];
        let i = 0;
        let hasErrors = false;
        for (const [key, value] of formData.entries()) {
           if (key === "question") {
               question = value;
           } else if (key === `answer${i}`) {
               if (value !== "") {
               answers.push(value)
               }
           }
           i++;
        }
        if (!question || question === "") {
            errors["question"] = true;
            hasErrors = true;
        } else {
            errors["question"] = false;
        }
        if (answers.length < 2 || answers.length > 6) {
            errors["answers"] = true;
            hasErrors = true;
        } else {
            errors["answers"] = false;
        }
        if (!hasErrors) {
        fetch("/questions",
{
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: "POST",
    body: JSON.stringify({question: question, answers: answers})
})
.then(function(res){ window.location.href = "/"})
.catch(function(res){ console.log(res) })
    }
}
</script>
<h1>Create a poll</h1>

<form action="/questions" on:submit|preventDefault={handleSubmit}>
    <h3>Question</h3>
    <textarea maxlength=100 type="text" id="question" name="question"></textarea>
     {#if errors.question}
            <p class="error-message">Question required</p>
     {/if}
 <ul>
  <h3>Answers</h3>
  {#each {length: answerCount} as _, i}
      <li class="answersList">
        <input maxlength=100 autocomplete="off" id={`answer${i+1}`} name={`answer${i+1}`}>
      </li>
  {/each}
 {#if errors.answers}
        <p class="error-message">At least 2 answers required</p>
 {/if}
 <button id="addButton" type="button" on:click={updateAnswerCount}>+</button>
 </ul>
 <button class="submitButton" type="submit">Submit</button>
</form>

<style>
    #question {
        margin-bottom: 2em;
        width: 30%;
        resize: none;
        overflow: hidden;
    }

    .error-message {
        color: red;
    }

    input {
        autocomplete: off;
    }

    .answersList {
        border-bottom: none;
        padding: 1em 1em;
    }

    .submitButton {
        width: 10em;
        border-radius: 8px;
        background-color: #4CAF50;
    }
    .submitButton:hover {
          background-color: green;
          color: white;
        }

    #addButton {
    }

</style>
