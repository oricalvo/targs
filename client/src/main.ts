

function main() {
    run({
        build: Command({
            verbose: Boolean(),
        }),
        rebuild: Command({
            verbose: Boolean(),
        }),
    });
}
