import {
    tokens,
    EVM_REPORT
} from './helpers';

const Token = artifacts.require("./Token");
require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Token', ([deployer, receiver, exchange]) => {
    const token_name = "Dharma"
    const token_symbol = "DHARMA"
    const token_decimal = '18'
    const token_totalSupply = tokens(1000000)
    let token

    describe('deployment', () => {
        beforeEach(async () => {
            token = await Token.new();
        })
        it('Tracks the name ', async () => {
            const name = await token.name();
            name.should.equal(token_name);
        });

        it('Tracks the symbol ', async () => {
            const symbol = await token.symbol();
            symbol.should.equal(token_symbol);
        });

        it('Tracks the decimals ', async () => {
            const decimals = await token.decimals();
            decimals.toString().should.equal(token_decimal);
        });

        it('Tracks the totalSupply ', async () => {
            const totalSupply = await token.totalSupply();
            totalSupply.toString().should.equal(token_totalSupply.toString());
        });

        it('assigns the totalSupply to the deployer ', async () => {
            const balances = await token.balanceOf(deployer);
            balances.toString().should.equal(token_totalSupply.toString());
        });


    })

    describe('sending tokens', () => {
        let amount;
        let result;

        describe('success', () => {
            beforeEach(async () => {
                amount = tokens(100);
                result = await token.transfer(receiver, tokens(100), {
                    from: deployer
                });
            })

            it('Transfers token balances', async () => {
                let balanceOf
                balanceOf = await token.balanceOf(deployer);
                balanceOf.toString().should.equal(tokens(999900).toString())
                balanceOf = await token.balanceOf(receiver);
                balanceOf.toString().should.equal(tokens(100).toString())

            });

            it('emits an transfer event', async () => {
                const log = result.logs[0];
                log.event.should.eq('Transfer');
                const event = log.args;
                event._from.toString().should.eq(deployer, 'from is correct')
                event._to.toString().should.eq(receiver, 'to is correct')
                event._value.toString().should.eq(amount.toString(), 'value is correct')
            });

        });
        describe('failure', () => {
            it('it rejects insufficient balances ', async () => {
                let invalidAmount;
                invalidAmount = tokens(1000000);
                await token.transfer(receiver, invalidAmount, {
                    from: deployer
                }).should.be.rejectedWith(EVM_REPORT);
            })
            it('it rejects invalid sende balances ', async () => {
                await token.transfer(0x0, amount, {
                    from: deployer
                }).should.be.rejected;
            })
        });

    })

    describe('approve tokens', () => {
        let result
        let amount
        beforeEach(async () => {
            amount = tokens(100);
            result = await token.approve(exchange, amount, {
                from: deployer
            });
        });
        describe('success ', () => {

            it('allocates an allowance for delegated token spending ', async () => {
                ;
                const allowance = await token.allowance(deployer, exchange);
                allowance.toString().should.eq(amount.toString());
            })
            it('emits an Approval Event ', async () => {
                const log = result.logs[0]
                log.event.should.eq('Approval')
                const event = log.args
                event.owner.toString().should.equal(deployer, 'from is correct')
                event.spender.should.equal(exchange, 'spender is correct')
                event._value.toString().should.equal(amount.toString(), 'value is correct')

            })
        })

        describe('failure', () => {
            it('reject invalid spenders ', async () => {
                await token.approve(0x0, amount, {
                    from: deployer
                }).should.be.rejected;
            })

        })
    })


    describe('delegated token transfers', () => {
        let amount;
        let result;

        beforeEach(async () => {
            amount = tokens(100);
            await token.approve(exchange, amount, {
                from: deployer
            });
        })

        describe('success', () => {
            beforeEach(async () => {
                result = await token.transferFrom(deployer, receiver, amount, {
                    from: exchange
                });
            })

            it('Transfers token balances', async () => {
                let balanceOf
                balanceOf = await token.balanceOf(deployer);
                balanceOf.toString().should.equal(tokens(999700).toString())
                balanceOf = await token.balanceOf(receiver);
                balanceOf.toString().should.equal(tokens(300).toString())

            });

            it('reset the allowances', async () => {
                const allowance = await token.allowance(deployer, exchange, {
                    from: deployer
                });
                allowance.toString().should.equal('0');
            });

            it('emits an transfer event', async () => {
                const log = result.logs[0];
                log.event.should.eq('Transfer');
                const event = log.args;
                event._from.toString().should.eq(deployer, 'from is correct')
                event._to.toString().should.eq(receiver, 'to is correct')
                event._value.toString().should.eq(amount.toString(), 'value is correct')
            });

        });
        describe('failure', () => {
            it('it rejects insufficient balances ', async () => {
                let invalidAmount;
                invalidAmount = tokens(1000000);
                await token.transferFrom(deployer, receiver, invalidAmount, {
                    from: exchange
                }).should.be.rejectedWith(EVM_REPORT);
            })
            it('it rejects invalid receipents ', async () => {
                await token.transfer(deployer, 0x0, amount, {
                    from: exchange
                }).should.be.rejected;
            })
        });

    })
});