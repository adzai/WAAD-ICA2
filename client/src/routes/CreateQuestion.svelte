<script>
    let errors = {}; // Holds validation errors for question and answers fields
    let answerCount = 2; // Minimum amount of question is 2, so it starts there
    // Updates the answerCount based and ensures that the max value is 6
    function updateAnswerCount() {
        if (answerCount < 6) {
            answerCount += 1;
        }
    }
    // Validates the form and sends the data to backend
    // Validation requirements: Question has to be filled and minimum of 2
    // answers have to be filled
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
                    answers.push(value);
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
            fetch("/questions", {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ question: question, answers: answers }),
            })
                .then(function (_) {
                    window.location.href = "/"; // Return the user to home page if successful
                })
                .catch(function (res) {
                    console.log(res);
                });
        }
    }
</script>

<h1>Create a poll</h1>

<form action="/questions" on:submit|preventDefault={handleSubmit}>
    <h3>Question</h3>
    <input
        autocomplete="off"
        maxlength="100"
        type="text"
        id="question"
        name="question"
    />
    <!-- Displays validation error -->
    {#if errors.question}
        <p class="error-message">Question required</p>
    {/if}
    <ul>
        <h3>Answers</h3>
        <!-- Creates the answer input fields dynamically.
             Starts at 2, user can add more input fields by pressing the + button.
             Max input fields = 6 -->
        {#each { length: answerCount } as _, i}
            <li class="answersList">
                <input
                    class="answerInput"
                    maxlength="100"
                    autocomplete="off"
                    id={`answer${i + 1}`}
                    name={`answer${i + 1}`}
                />
            </li>
        {/each}
        <!-- Displays validation error -->
        {#if errors.answers}
            <p class="error-message">At least 2 answers required</p>
        {/if}
        <button id="addButton" type="button" on:click={updateAnswerCount}
            >+</button
        >
    </ul>
    <button class="submitButton" type="submit">Submit</button>
</form>

<style>
    form {
        box-sizing: border-box;
        padding: 2rem;
        border-radius: 1rem;
        background-color: hsl(0, 0%, 100%);
        border: 4px solid hsl(0, 0%, 90%);
        gap: 2rem;
    }
    h3 {
        font-size: 3em;
    }
    .answerInput {
        height: 2em;
        width: 60%;
        font-size: 1.5em;
    }
    #question {
        margin-bottom: 1em;
        width: 77%;
        font-size: 2.5em;
        resize: none;
        overflow: hidden;
    }

    .error-message {
        color: red;
    }

    .answersList {
        border-bottom: none;
        padding: 1em 1em;
    }

    .submitButton {
        width: 10em;
        border-radius: 8px;
        color: #fff;
        background-color: #4caf50;
        cursor: pointer;
    }
    .submitButton:hover {
        background-color: #2c974b;
        color: white;
    }

    #addButton {
        appearance: none;
        border: 1px solid rgba(27, 31, 35, 0.15);
        border-radius: 6px;
        box-shadow: rgba(27, 31, 35, 0.1) 0 1px 0;
        box-sizing: border-box;
        color: #000;
        cursor: pointer;
        display: inline-block;
        font-size: 14px;
        font-weight: 600;
        line-height: 20px;
        padding: 6px 16px;
        position: relative;
        text-align: center;
        text-decoration: none;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        vertical-align: middle;
        white-space: nowrap;
    }

    #addButton:focus:not(:focus-visible):not(.focus-visible) {
        box-shadow: none;
        outline: none;
    }

    #addButton:hover {
        background-color: #2c974b;
        color: #fff;
    }

    #addButton:focus {
        box-shadow: rgba(46, 164, 79, 0.4) 0 0 0 3px;
        outline: none;
    }

    #addButton:disabled {
        background-color: #94d3a2;
        border-color: rgba(27, 31, 35, 0.1);
        color: rgba(255, 255, 255, 0.8);
        cursor: default;
    }

    #addButton:active {
        background-color: #298e46;
        box-shadow: rgba(20, 70, 32, 0.2) 0 1px 0 inset;
    }
</style>
