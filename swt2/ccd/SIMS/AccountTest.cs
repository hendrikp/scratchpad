/** CCD/TDD - test project - Hendrik Polczynski 02.12.2018 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;

namespace SIMS
{
	[TestFixture]
	public class AccountTest
	{
        Account acc;
        
        [SetUp]
        public void Setup()
        {
            acc = new Account(new SerialIdGenerator().GenerateId());
        }
        [Test]
		public void Create_an_account_with_zero_money()
		{
            
			Assert.IsTrue(acc.Balance == 0);
		}

		[Test]
		public void Created_Account_has_ID()
		{
			Assert.IsNotNull(acc.Id);
		}

        [Test]
        public void Withdrawing_Money_From_An_Account_When_Balance_Is_Not_Sufficient_IsRejected()
        {
            Assert.Throws<InvalidOperationException>(() => acc.Withdraw(1000));
        }

		[Test]
		public void Deposit_money_raises_account_balance()
		{
			ulong balanceBeforeDeposit = acc.Balance;

			acc.Deposit(1000);

            ulong expectedBalanceAfterDeposit = (balanceBeforeDeposit + 1000);

			Assert.AreEqual(  expectedBalanceAfterDeposit, acc.Balance);
		}

        [Test]
        public void Withdrawing_Money_From_An_Account_When_Balance_Is_Sufficient_Decreases_Balance()
        {
            acc.Deposit(1000);
            ulong balanceBeforeWithdrawal = acc.Balance;
            acc.Withdraw(100);
            ulong expectedBalanceAfterWithdrawal = balanceBeforeWithdrawal - 100;

            Assert.AreEqual(expectedBalanceAfterWithdrawal, acc.Balance);
        }

        [Test]
        public void Withdrawing_All_Money_From_An_Account_When_Balance_Is_Sufficient_Zeroes_It()
        {
            acc.Deposit(1000);
            ulong balanceBeforeWithdrawal = acc.Balance;
            acc.Withdraw(1000);
            ulong expectedBalanceAfterWithdrawal = 0;

            Assert.AreEqual(expectedBalanceAfterWithdrawal, acc.Balance);
        }

		[Test]
		public void Bank_wants_to_know_total_no_of_accounts()
		{
			Bank bank = new Bank();

			Customer klaus = bank.CreateCustomer("Klaus", "Mueller");
			bank.CreateAccount(klaus);

			Assert.Greater(bank.NumberOfAccounts, 0);
		}

		[Test]
		public void Bank_with_several_customers_has_many_accounts()
		{
			Bank bank = new Bank();

			Customer Klaus = bank.CreateCustomer("Klaus", "Mueller");
			bank.CreateAccount(Klaus);

			Customer Heinz = bank.CreateCustomer("Heinz", "BlA");
			bank.CreateAccount(Heinz);
			bank.CreateAccount(Heinz);

			Customer Klaus1 = bank.CreateCustomer("Klaus", "kLEBER");
			bank.CreateAccount(Klaus1);
			bank.CreateAccount(Klaus1);
			bank.CreateAccount(Klaus1);

			Assert.AreEqual(bank.NumberOfAccounts, 6);
		}
		[Test]
		public void Empty_bank_has_zero_total_balance()
		{
			Bank bank = new Bank();

			Assert.AreEqual(bank.TotalBalance, 0);
		}

		[Test]
		public void Bank_with_several_accounts_calculates_correct_total_balance()
		{
			Bank bank = new Bank();

			Customer Klaus = bank.CreateCustomer("Klaus", "Mueller");
			bank.CreateAccount(Klaus).Deposit(100);

			Customer Heinz = bank.CreateCustomer("Heinz", "BlA");
			bank.CreateAccount(Heinz);
			bank.CreateAccount(Heinz).Deposit(200);

			Customer Klaus1 = bank.CreateCustomer("Klaus", "kLEBER");
			bank.CreateAccount(Klaus1);
			bank.CreateAccount(Klaus1);
			bank.CreateAccount(Klaus1).Deposit(300);

			Assert.AreEqual(bank.TotalBalance, 600);
		}
	}
}
