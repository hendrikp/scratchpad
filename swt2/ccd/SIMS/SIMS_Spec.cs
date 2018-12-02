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
    public class A_Bank
    {
        Bank _bank;

        [SetUp]
        public void Setup() {
            _bank = new Bank();
        }

        [Test]
        public void Has_no_accounts_and_customers_after_creation()
        {
            Assert.AreEqual(0, _bank.NumberOfCustomers);
            Assert.AreEqual(0, _bank.NumberOfAccounts);
        }

        [Test]
        public void Has_customer_after_customer_creation()
        {
            Customer customer = GivenCustomerHans();
            Assert.AreEqual(1, _bank.NumberOfCustomers);
            Assert.NotNull(customer);
        }

        [Test]
        public void Ensures_that_a_customer_has_a_correct_name_after_creation()
        {
            Customer customer = GivenCustomerHans();
            Assert.AreEqual("Hans", customer.FirstName);
            Assert.AreEqual("Wurst", customer.LastName);
        }

        private Customer GivenCustomerHans()
        {
            Customer customer = _bank.CreateCustomer("Hans", "Wurst");
            return customer;
        }

        [Test]
        public void Ensures_that_a_customer_has_a_non_null_id()
        {
            Customer customer = GivenCustomerHans();
            Assert.AreNotEqual(new Id(), customer.Id);
        }

        [Test]
        public void Ensures_that_two_created_customers_have_different_ids()
        {
            Customer customer1 = GivenCustomerHans();
            Customer customer2 = GivenCustomerKlaus();
            Assert.AreNotEqual(customer1.Id, customer2.Id);
        }

        private Customer GivenCustomerKlaus()
        {
            Customer customer = _bank.CreateCustomer("Klaus", "Pappsack");
            return customer;
        }

        [Test]
        public void Ensures_that_given_a_valid_customer_id_the_correct_customer_is_returned()
        {
            Customer customer1 = GivenCustomerHans();
            Customer customer2 = GivenCustomerKlaus();

            var foundCustomer1 = _bank.FindCustomer(customer1.Id);
            var foundCustomer2 = _bank.FindCustomer(customer2.Id);

            Assert.AreEqual(foundCustomer1, customer1);
            Assert.AreEqual(foundCustomer2, customer2);
        }

        [Test]
        public void Rejects_an_invalid_customer_id()
        {
            Id invalidId = new Id();
            Assert.Throws<CustomerNotFoundException>( () => _bank.FindCustomer( invalidId ) );
        }

		[Test]
		public void Creating_an_account_for_null_customer_throws_exception()
		{
			Assert.Catch<ArgumentNullException>(() => { _bank.CreateAccount(null); });
		}

		[Test]
		public void Creating_an_account_returns_not_null()
		{
			var account = _bank.CreateAccount(GivenCustomerKlaus());
			Assert.NotNull(account);
		}

		[Test]
		public void Finding_an_exising_account_returns_it()
		{
			var customer = GivenCustomerKlaus();
			var account1 = _bank.CreateAccount(customer);
			var account2 = _bank.CreateAccount(customer);

			Assert.IsTrue(object.ReferenceEquals(account1, _bank.FindAccount(account1.Id)));
			Assert.IsTrue(object.ReferenceEquals(account2, _bank.FindAccount(account2.Id)));
		}

		[Test]
		public void Finding_an_non_exising_account_throws_exception()
		{
			var customer = GivenCustomerKlaus();
			var account1 = _bank.CreateAccount(customer);
			var account2 = _bank.CreateAccount(customer);

			var invalidID = new SerialIdGenerator().GenerateId();

            Assert.Catch<AccountNotFoundException>(() => { _bank.FindAccount(invalidID); });
		}

		[Test]
		public void Customer_last_and_first_name_and_can_be_changed()
		{
			Bank bank = new Bank();

			Customer UserWithChangedName = bank.CreateCustomer("Klaus", "Mueller");
			UserWithChangedName.ChangeName("Stefan", "Huber");

			Assert.AreEqual("Stefan", UserWithChangedName.FirstName);
			Assert.AreEqual("Huber", UserWithChangedName.LastName);
		}

        [Test]
        public void Deleting_an_non_empty_account_throws_exception()
        {
            var customer = GivenCustomerKlaus();
            var account1 = _bank.CreateAccount(customer);
            account1.Deposit(1);
            var account2 = _bank.CreateAccount(customer);

            Assert.Catch<InvalidOperationException>(() => { _bank.DeleteAccount(account1.Id); });
        }

        [Test]
        public void Deleting_a_empty_account_is_successfull()
        {
            var customer = GivenCustomerKlaus();
            var account1 = _bank.CreateAccount(customer);
            account1.Deposit(1);
            var account2 = _bank.CreateAccount(customer);

            Assert.AreEqual(2, customer.Accounts.Count());

            _bank.DeleteAccount(account2.Id);

            Assert.Catch<AccountNotFoundException>(() => { _bank.FindAccount(account2.Id); });

            Assert.AreEqual(1, customer.Accounts.Count());
            Assert.IsFalse(customer.Accounts.Contains(account2));
        }
    }

    [TestFixture]
    public class A_Customer 
    {
        private Bank _bank;

        [SetUp]
        public void Setup()
        {
            _bank = new Bank();
        }

        private Customer GivenCustomerKlaus()
        {
            Customer customer = _bank.CreateCustomer("Klaus", "Pappsack");
            return customer;
        }

        [Test]
        public void Can_list_his_accounts()
        {
            var customer = GivenCustomerKlaus();
            var account1 = _bank.CreateAccount(customer);
            account1.Deposit(1);
            var account2 = _bank.CreateAccount(customer);

            Assert.IsTrue(customer.Accounts.Contains(account1));
            Assert.IsTrue(customer.Accounts.Contains(account2));
            Assert.AreEqual(2, customer.Accounts.Count());
        }
    }
}
